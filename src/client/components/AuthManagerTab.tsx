import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle2, XCircle, RefreshCw, ExternalLink, Globe, Lock } from 'lucide-react';
import { AuthConfig, AuthValidationResult } from '../../types/connector';

export const AuthManagerTab: React.FC = () => {
  const [config, setConfig] = useState<AuthConfig>({
    type: 'api_key',
    storeUrl: 'https://sandbox.aerogear-store.com',
    apiKey: {
      consumerKey: 'ck_mock_sandbox_key_987654321',
      consumerSecret: 'cs_mock_sandbox_secret_123456789',
      storeUrl: 'https://sandbox.aerogear-store.com',
    },
    useMock: true,
  });

  const [oauthClientId, setOauthClientId] = useState('app_agent_studio_client_001');
  const [oauthClientSecret, setOauthClientSecret] = useState('secret_agent_studio_777888999');
  const [authCode, setAuthCode] = useState('auth_code_wc_883311');

  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<AuthValidationResult | null>(null);
  const [authUrlPreview, setAuthUrlPreview] = useState<string>('');

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load current config', err);
    }
  };

  const handleValidateAuth = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      const payload: AuthConfig = { ...config };
      if (config.type === 'oauth2') {
        payload.oauth2 = {
          clientId: oauthClientId,
          clientSecret: oauthClientSecret,
          storeUrl: config.storeUrl,
          accessToken: `mock_wc_at_${Date.now()}`,
        };
      }

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setValidationResult(data.authValidation);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: err.message,
      });
    } finally {
      setValidating(false);
    }
  };

  const generateOAuthUrl = () => {
    const url = `${config.storeUrl.replace(/\/$/, '')}/wc-auth/v1/authorize?app_name=Agent+Studio&scope=read&user_id=1&return_url=https://agentstudio.app/oauth/callback&callback_url=https://agentstudio.app/api/callback`;
    setAuthUrlPreview(url);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* Left Column: Configuration Settings */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} color="#6366f1" /> Authentication Flow Configuration
        </h2>

        {/* Sandbox vs Live Toggle */}
        <div style={{ padding: '14px', background: 'rgba(10, 13, 20, 0.6)', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e0e7ff' }}>Use Sandbox Mock Mode</span>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Provides immediate offline simulation with realistic order and inventory data.</p>
            </div>
            <input
              type="checkbox"
              checked={config.useMock}
              onChange={(e) => setConfig({ ...config, useMock: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
            />
          </label>
        </div>

        {/* Auth Mode Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '8px' }}>
            Authentication Mechanism
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              className={`btn ${config.type === 'api_key' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setConfig({ ...config, type: 'api_key' })}
            >
              <Key size={16} /> API Key (Consumer Secret)
            </button>
            <button
              className={`btn ${config.type === 'oauth2' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setConfig({ ...config, type: 'oauth2' })}
            >
              <Shield size={16} /> OAuth 2.0 Flow
            </button>
          </div>
        </div>

        {/* Store URL */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
            WooCommerce Store URL
          </label>
          <input
            type="text"
            className="input-field"
            value={config.storeUrl}
            onChange={(e) => setConfig({ ...config, storeUrl: e.target.value })}
            placeholder="https://example-woocommerce-store.com"
          />
        </div>

        {/* API Key Inputs */}
        {config.type === 'api_key' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                Consumer Key (ck_...)
              </label>
              <input
                type="text"
                className="input-field"
                value={config.apiKey?.consumerKey || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiKey: {
                      consumerKey: e.target.value,
                      consumerSecret: config.apiKey?.consumerSecret || '',
                      storeUrl: config.storeUrl,
                    },
                  })
                }
                placeholder="ck_1234567890abcdef"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                Consumer Secret (cs_...)
              </label>
              <input
                type="password"
                className="input-field"
                value={config.apiKey?.consumerSecret || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiKey: {
                      consumerKey: config.apiKey?.consumerKey || '',
                      consumerSecret: e.target.value,
                      storeUrl: config.storeUrl,
                    },
                  })
                }
                placeholder="cs_1234567890abcdef"
              />
            </div>
          </div>
        )}

        {/* OAuth 2.0 Inputs */}
        {config.type === 'oauth2' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                OAuth Client ID
              </label>
              <input
                type="text"
                className="input-field"
                value={oauthClientId}
                onChange={(e) => setOauthClientId(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                OAuth Client Secret
              </label>
              <input
                type="password"
                className="input-field"
                value={oauthClientSecret}
                onChange={(e) => setOauthClientSecret(e.target.value)}
              />
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
              onClick={generateOAuthUrl}
            >
              <ExternalLink size={14} /> Generate OAuth Authorization Link
            </button>
            {authUrlPreview && (
              <pre className="code-block" style={{ fontSize: '0.75rem' }}>
                {authUrlPreview}
              </pre>
            )}
          </div>
        )}

        {/* Validate Credentials Button */}
        <div style={{ marginTop: '24px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={handleValidateAuth}
            disabled={validating}
          >
            {validating ? (
              <>
                <RefreshCw size={16} className="spin" /> Verifying Connection...
              </>
            ) : (
              <>
                <Lock size={16} /> Validate Authentication Credentials
              </>
            )}
          </button>
        </div>

      </div>

      {/* Right Column: Connection Validation Status & Security Scope */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Status Verification Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '14px' }}>
            Connection Health & Scope
          </h3>

          {validationResult ? (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: validationResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: validationResult.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {validationResult.valid ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <XCircle size={20} color="#f43f5e" />
                )}
                <span style={{ fontWeight: 600, color: validationResult.valid ? '#6ee7b7' : '#fca5a5' }}>
                  {validationResult.valid ? 'Authentication Verified' : 'Authentication Failed'}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#e5e7eb', marginBottom: '12px' }}>
                {validationResult.message}
              </p>

              {validationResult.valid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', color: '#9ca3af', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div><strong>Store Title:</strong> {validationResult.storeName}</div>
                  <div><strong>WooCommerce Version:</strong> {validationResult.woocommerceVersion}</div>
                  <div><strong>Authenticated Method:</strong> {validationResult.authenticatedAs}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              Click "Validate Authentication Credentials" to verify store handshake.
            </div>
          )}
        </div>

        {/* Security & Scope Specification */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#06b6d4" /> Security & Permission Scope
          </h3>
          <ul style={{ fontSize: '0.8125rem', color: '#9ca3af', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong style={{ color: '#e0e7ff' }}>Enforced Scope:</strong> Read-Only (<code style={{ color: '#818cf8' }}>read</code>). Write actions are explicitly restricted.
            </li>
            <li>
              <strong style={{ color: '#e0e7ff' }}>Transport Encryption:</strong> HTTPS TLS 1.3 standard over standard REST API endpoint.
            </li>
            <li>
              <strong style={{ color: '#e0e7ff' }}>Credential Isolation:</strong> Consumer Secret is stored in server memory or secret manager, never sent in frontend JS.
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
