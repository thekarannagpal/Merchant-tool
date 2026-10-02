import { AuthConfig, AuthValidationResult, ApiKeyCredentials, OAuth2Credentials } from '../types/connector';
import axios from 'axios';

export class AuthManager {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  public getConfig(): AuthConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generates authorization headers or query parameters for API calls
   */
  public getAuthRequestParams(): { headers: Record<string, string>; params: Record<string, string> } {
    if (this.config.useMock) {
      return {
        headers: { Authorization: 'Bearer mock_access_token_agent_studio_12345' },
        params: {},
      };
    }

    if (this.config.type === 'api_key' && this.config.apiKey) {
      const { consumerKey, consumerSecret } = this.config.apiKey;

      // If store is HTTPS, Basic auth is standard for WooCommerce
      const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      return {
        headers: { Authorization: authHeader },
        params: {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        },
      };
    }

    if (this.config.type === 'oauth2' && this.config.oauth2?.accessToken) {
      return {
        headers: { Authorization: `Bearer ${this.config.oauth2.accessToken}` },
        params: {},
      };
    }

    return { headers: {}, params: {} };
  }

  /**
   * Generates the OAuth 2.0 Authorization Redirect URL for Agent Studio / User consent
   */
  public generateOAuthAuthorizationUrl(redirectUri: string, state: string): string {
    const oauth = this.config.oauth2;
    if (!oauth) throw new Error('OAuth2 credentials not configured');

    const authEndpoint = oauth.authUrl || `${this.config.storeUrl.replace(/\/$/, '')}/wc-auth/v1/authorize`;
    const params = new URLSearchParams({
      app_name: 'Agent Studio WooCommerce Connector',
      scope: oauth.scope || 'read',
      user_id: 'agent_user_1',
      return_url: redirectUri,
      callback_url: `${redirectUri}/callback`,
      state: state,
      client_id: oauth.clientId,
      response_type: 'code',
    });

    return `${authEndpoint}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an OAuth 2.0 access token & refresh token
   */
  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuth2Credentials> {
    const oauth = this.config.oauth2;
    if (!oauth) throw new Error('OAuth2 credentials not configured');

    if (this.config.useMock) {
      const updatedOauth: OAuth2Credentials = {
        ...oauth,
        accessToken: `mock_wc_at_${Date.now()}`,
        refreshToken: `mock_wc_rt_${Date.now()}`,
        expiresAt: Date.now() + 3600 * 1000,
      };
      this.config.oauth2 = updatedOauth;
      return updatedOauth;
    }

    const tokenEndpoint = oauth.tokenUrl || `${this.config.storeUrl.replace(/\/$/, '')}/wp-json/oauth/token`;
    
    try {
      const response = await axios.post(tokenEndpoint, {
        grant_type: 'authorization_code',
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const data = response.data;
      const updatedOauth: OAuth2Credentials = {
        ...oauth,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };

      this.config.oauth2 = updatedOauth;
      return updatedOauth;
    } catch (err: any) {
      throw new Error(`OAuth code exchange failed: ${err.response?.data?.message || err.message}`);
    }
  }

  /**
   * Validates authentication credentials against live WooCommerce endpoint or mock sandbox
   */
  public async validateCredentials(): Promise<AuthValidationResult> {
    if (this.config.useMock) {
      return {
        valid: true,
        message: 'Successfully authenticated with WooCommerce Sandbox (Mock Mode)',
        storeName: 'AeroGear Merchant Store (Sandbox)',
        woocommerceVersion: '8.5.2',
        authenticatedAs: this.config.type === 'api_key' ? 'Consumer Key (ck_mock...)' : 'OAuth 2.0 Bearer Token',
      };
    }

    const storeUrl = this.config.storeUrl.replace(/\/$/, '');
    const { headers, params } = this.getAuthRequestParams();
    const endpoint = `${storeUrl}/wp-json/wc/v3/system_status`;

    try {
      const response = await axios.get(endpoint, {
        headers,
        params,
        timeout: 8000,
      });

      const data = response.data;
      return {
        valid: true,
        message: 'Successfully connected and verified WooCommerce REST API access',
        storeName: data.environment?.site_title || storeUrl,
        woocommerceVersion: data.environment?.version || 'v3',
        authenticatedAs: this.config.type === 'api_key' ? 'API Key (Read Scope)' : 'OAuth 2.0 Access Token',
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      return {
        valid: false,
        message: `Authentication failed: ${errorMsg} (HTTP ${err.response?.status || 500})`,
      };
    }
  }
}
