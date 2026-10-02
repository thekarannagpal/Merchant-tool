import { RateLimitStatus, RateLimitEvent } from '../types/connector';

export interface RateLimiterOptions {
  maxRequestsPerMinute?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  jitter?: boolean;
}

export class RateLimiter {
  private limit: number;
  private remaining: number;
  private resetTimestamp: number;
  private maxRetries: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;
  private useJitter: boolean;

  private totalRequests: number = 0;
  private throttledRequests: number = 0;
  private retriedRequests: number = 0;
  private activeBackoffMs: number = 0;
  private eventLog: RateLimitEvent[] = [];
  private eventListeners: Array<(event: RateLimitEvent) => void> = [];

  constructor(options: RateLimiterOptions = {}) {
    this.limit = options.maxRequestsPerMinute || 60;
    this.remaining = this.limit;
    this.resetTimestamp = Date.now() + 60000;
    this.maxRetries = options.maxRetries ?? 4;
    this.initialBackoffMs = options.initialBackoffMs ?? 500;
    this.maxBackoffMs = options.maxBackoffMs ?? 16000;
    this.useJitter = options.jitter ?? true;

    // Periodically replenish local token bucket if headers not provided by server
    setInterval(() => this.replenishTokens(), 1000);
  }

  private replenishTokens(): void {
    const now = Date.now();
    if (now >= this.resetTimestamp) {
      this.remaining = this.limit;
      this.resetTimestamp = now + 60000;
    }
  }

  public addEventListener(listener: (event: RateLimitEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private logEvent(event: Omit<RateLimitEvent, 'timestamp'>): void {
    const fullEvent: RateLimitEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.eventLog.unshift(fullEvent);
    if (this.eventLog.length > 100) this.eventLog.pop();
    this.eventListeners.forEach((fn) => fn(fullEvent));
  }

  public getStatus(): RateLimitStatus {
    const now = Date.now();
    const resetSeconds = Math.max(0, Math.ceil((this.resetTimestamp - now) / 1000));
    return {
      limit: this.limit,
      remaining: Math.max(0, this.remaining),
      resetSeconds,
      isThrottled: this.remaining <= 0 || this.activeBackoffMs > 0,
      activeBackoffMs: this.activeBackoffMs,
      totalRequests: this.totalRequests,
      throttledRequests: this.throttledRequests,
      retriedRequests: this.retriedRequests,
    };
  }

  public getLogs(): RateLimitEvent[] {
    return [...this.eventLog];
  }

  public updateFromHeaders(headers: Record<string, any>): void {
    if (!headers) return;

    const limitHeader = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'];
    const remainingHeader = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
    const resetHeader = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];

    if (limitHeader !== undefined) {
      this.limit = parseInt(String(limitHeader), 10) || this.limit;
    }
    if (remainingHeader !== undefined) {
      this.remaining = parseInt(String(remainingHeader), 10);
    }
    if (resetHeader !== undefined) {
      const resetVal = parseInt(String(resetHeader), 10);
      // Header can be epoch timestamp or seconds from now
      this.resetTimestamp = resetVal > 1000000000 ? resetVal * 1000 : Date.now() + resetVal * 1000;
    }
  }

  /**
   * Calculates exponential backoff delay with optional jitter
   */
  public calculateBackoffDelay(attempt: number, retryAfterSeconds?: number): number {
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      return retryAfterSeconds * 1000;
    }

    const exponentialDelay = this.initialBackoffMs * Math.pow(2, attempt - 1);
    const cappedDelay = Math.min(this.maxBackoffMs, exponentialDelay);

    if (this.useJitter) {
      // Full jitter: Random delay between 50% and 100% of calculated exponential delay
      const jitterFactor = 0.5 + Math.random() * 0.5;
      return Math.round(cappedDelay * jitterFactor);
    }

    return cappedDelay;
  }

  /**
   * Wraps an async HTTP call with rate limiting, header tracking, 429 interception, and automatic retries with exponential backoff.
   */
  public async executeWithRateLimit<T>(
    endpoint: string,
    executeFn: () => Promise<{ data: T; headers?: Record<string, any>; status?: number }>
  ): Promise<T> {
    this.totalRequests++;

    // Proactive client-side throttling if remaining tokens <= 0
    if (this.remaining <= 0) {
      const waitMs = Math.max(500, this.resetTimestamp - Date.now());
      this.throttledRequests++;
      this.logEvent({
        type: 'THROTTLED',
        endpoint,
        delayMs: waitMs,
        remainingTokens: 0,
        message: `Client token bucket empty. Proactively throttling request for ${waitMs}ms`,
      });
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 3000)));
    }

    let attempt = 0;

    while (attempt <= this.maxRetries) {
      attempt++;
      this.remaining = Math.max(0, this.remaining - 1);

      this.logEvent({
        type: 'REQUEST',
        endpoint,
        attempt,
        remainingTokens: this.remaining,
        message: `Executing request to ${endpoint} (Attempt ${attempt}/${this.maxRetries + 1})`,
      });

      try {
        const response = await executeFn();

        if (response.headers) {
          this.updateFromHeaders(response.headers);
        }

        this.logEvent({
          type: 'SUCCESS',
          endpoint,
          statusCode: response.status || 200,
          attempt,
          remainingTokens: this.remaining,
          message: `Request succeeded on attempt ${attempt}`,
        });

        return response.data;
      } catch (err: any) {
        const statusCode = err.response?.status || err.status || 500;
        const headers = err.response?.headers || {};

        if (headers) {
          this.updateFromHeaders(headers);
        }

        // Check if error is Rate Limit (429) or temporary server error (502, 503, 504)
        const isRateLimited = statusCode === 429;
        const isTransientServerError = statusCode === 502 || statusCode === 503 || statusCode === 504;

        if ((isRateLimited || isTransientServerError) && attempt <= this.maxRetries) {
          this.retriedRequests++;
          const retryAfterHeader = headers['retry-after'];
          const retryAfterSeconds = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : undefined;

          const backoffMs = this.calculateBackoffDelay(attempt, retryAfterSeconds);
          this.activeBackoffMs = backoffMs;

          this.logEvent({
            type: 'BACKOFF',
            endpoint,
            statusCode,
            attempt,
            delayMs: backoffMs,
            message: `Rate limit (HTTP ${statusCode}) detected. Applying exponential backoff delay of ${backoffMs}ms before retry`,
          });

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          this.activeBackoffMs = 0;
        } else {
          // Unrecoverable error or max retries exceeded
          this.logEvent({
            type: 'FAILED',
            endpoint,
            statusCode,
            attempt,
            message: `Request failed permanently: ${err.message || 'Unknown error'}`,
          });
          throw err;
        }
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded for endpoint: ${endpoint}`);
  }
}
