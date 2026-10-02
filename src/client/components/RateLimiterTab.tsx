import React, { useState, useEffect } from 'react';
import { Activity, Flame, ShieldAlert, Clock, RefreshCw, Cpu, CheckCircle } from 'lucide-react';
import { RateLimitStatus, RateLimitEvent } from '../../types/connector';

export const RateLimiterTab: React.FC = () => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [logs, setLogs] = useState<RateLimitEvent[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(15);

  useEffect(() => {
    fetchRateLimitStatus();
    const interval = setInterval(fetchRateLimitStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRateLimitStatus = async () => {
    try {
      const res = await fetch('/api/rate-limit/status');
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch rate limiter status', err);
    }
  };

  const handleSimulateBurst = async () => {
    setSimulating(true);
    try {
      await fetch('/api/rate-limit/simulate-burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: burstCount }),
      });
      await fetchRateLimitStatus();
    } catch (err) {
      console.error('Failed burst simulation', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
      
      {/* Left Column: Bucket Metrics & Simulation Trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Token Bucket Monitor Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#10b981" /> Token Bucket Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Tokens Remaining Visual Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                <span style={{ color: '#9ca3af' }}>Tokens Remaining</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>
                  {status?.remaining ?? 60} / {status?.limit ?? 60}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, ((status?.remaining ?? 60) / (status?.limit ?? 60)) * 100))}%`,
                    height: '100%',
                    background: status?.isThrottled
                      ? 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)'
                      : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(10, 13, 20, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Total Requests</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e0e7ff' }}>{status?.totalRequests ?? 0}</div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(10, 13, 20, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Window Reset In</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>{status?.resetSeconds ?? 60}s</div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(10, 13, 20, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Throttled / 429</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{status?.throttledRequests ?? 0}</div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(10, 13, 20, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Retried & Resolved</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a855f7' }}>{status?.retriedRequests ?? 0}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Burst Traffic Simulator Control Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="#f43f5e" /> Traffic Burst Simulator
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '14px' }}>
            Fire a concurrent wave of requests to test sliding-window token depletion, HTTP 429 detection, and exponential backoff retry handling.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                Simulated Burst Request Count
              </label>
              <input
                type="number"
                className="input-field"
                value={burstCount}
                onChange={(e) => setBurstCount(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)' }}
              onClick={handleSimulateBurst}
              disabled={simulating}
            >
              {simulating ? (
                <>
                  <RefreshCw size={16} className="spin" /> Executing Burst Wave...
                </>
              ) : (
                <>
                  <Flame size={16} /> Fire {burstCount} Concurrent Requests
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Right Column: Live Telemetry Event Stream Log */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#a855f7" /> Live Rate Limiter Telemetry Stream
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Showing last 100 events</span>
        </div>

        <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No rate limiter events logged yet. Fire a traffic burst to watch backoff events live!
            </div>
          ) : (
            logs.map((evt, idx) => {
              let badgeColor = '#6366f1';
              let badgeBg = 'rgba(99, 102, 241, 0.15)';

              if (evt.type === 'SUCCESS') { badgeColor = '#10b981'; badgeBg = 'rgba(16, 185, 129, 0.15)'; }
              if (evt.type === 'BACKOFF' || evt.type === 'THROTTLED') { badgeColor = '#f59e0b'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
              if (evt.type === 'FAILED') { badgeColor = '#f43f5e'; badgeBg = 'rgba(244, 63, 94, 0.15)'; }

              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(10, 13, 20, 0.6)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: badgeColor,
                          background: badgeBg,
                        }}
                      >
                        {evt.type}
                      </span>
                      <span style={{ fontWeight: 600, color: '#e0e7ff', fontFamily: 'var(--font-mono)' }}>
                        {evt.endpoint}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: '0.775rem' }}>
                    {evt.message}
                    {evt.delayMs && (
                      <span style={{ marginLeft: '8px', color: '#fcd34d', fontWeight: 600 }}>
                        (Delay: {evt.delayMs}ms)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
