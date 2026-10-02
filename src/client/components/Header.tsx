import React from 'react';
import { ShoppingBag, ShieldCheck, Zap, Server, Activity } from 'lucide-react';
import { AuthConfig, RateLimitStatus } from '../../types/connector';

interface HeaderProps {
  config: AuthConfig | null;
  rateLimitStatus: RateLimitStatus | null;
}

export const Header: React.FC<HeaderProps> = ({ config, rateLimitStatus }) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <ShoppingBag size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f3f4f6' }}>
                WooCommerce Connector
              </h1>
              <span className="badge badge-completed" style={{ textTransform: 'none' }}>
                <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                Agent Studio Ready
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
              OAuth & API-Key Auth • Orders & Inventory Primitives • Sliding Window Rate Limiter • MCP Tool Spec
            </p>
          </div>
        </div>

        {/* Right Telemetry Pill Statuses */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Store Mode Badge */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(10, 13, 20, 0.6)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Server size={14} color="#06b6d4" />
            <span style={{ color: '#9ca3af' }}>Store:</span>
            <span style={{ fontWeight: 600, color: config?.useMock ? '#fcd34d' : '#6ee7b7' }}>
              {config?.useMock ? 'Sandbox (Mock Data)' : config?.storeUrl || 'Disconnected'}
            </span>
          </div>

          {/* Auth Method Badge */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(10, 13, 20, 0.6)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} color="#a855f7" />
            <span style={{ color: '#9ca3af' }}>Auth:</span>
            <span style={{ fontWeight: 600, color: '#e0e7ff' }}>
              {config?.type === 'oauth2' ? 'OAuth 2.0' : 'API Key (Consumer Secret)'}
            </span>
          </div>

          {/* Rate Limit Tokens Badge */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: rateLimitStatus?.isThrottled ? 'rgba(244, 63, 94, 0.15)' : 'rgba(10, 13, 20, 0.6)',
              border: rateLimitStatus?.isThrottled ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={14} color={rateLimitStatus?.isThrottled ? '#fca5a5' : '#10b981'} />
            <span style={{ color: '#9ca3af' }}>Bucket:</span>
            <span style={{ fontWeight: 700, color: rateLimitStatus?.isThrottled ? '#fca5a5' : '#10b981' }}>
              {rateLimitStatus?.remaining ?? 60} / {rateLimitStatus?.limit ?? 60} req/min
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
