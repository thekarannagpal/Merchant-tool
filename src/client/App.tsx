import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PrimitivesTab } from './components/PrimitivesTab';
import { AuthManagerTab } from './components/AuthManagerTab';
import { RateLimiterTab } from './components/RateLimiterTab';
import { MCPSpecsTab } from './components/MCPSpecsTab';
import { CapabilitiesTab } from './components/CapabilitiesTab';
import { AuthConfig, RateLimitStatus } from '../types/connector';
import { Play, Key, Activity, Terminal, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'primitives' | 'auth' | 'ratelimit' | 'mcp' | 'capabilities'>('primitives');
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);

  useEffect(() => {
    fetchGlobalStatus();
    const interval = setInterval(fetchGlobalStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalStatus = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.config) setConfig(data.config);
      if (data.rateLimiterStatus) setRateLimitStatus(data.rateLimiterStatus);
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 60px 20px' }}>
      
      {/* App Header */}
      <Header config={config} rateLimitStatus={rateLimitStatus} />

      {/* Main Tab Navigation */}
      <nav className="glass-panel" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        
        <button
          className={`btn ${activeTab === 'primitives' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('primitives')}
        >
          <Play size={16} /> Primitives Studio
        </button>

        <button
          className={`btn ${activeTab === 'auth' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('auth')}
        >
          <Key size={16} /> Auth & OAuth Manager
        </button>

        <button
          className={`btn ${activeTab === 'ratelimit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('ratelimit')}
        >
          <Activity size={16} /> Rate Limit Handling
        </button>

        <button
          className={`btn ${activeTab === 'mcp' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('mcp')}
        >
          <Terminal size={16} /> MCP Specification
        </button>

        <button
          className={`btn ${activeTab === 'capabilities' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('capabilities')}
        >
          <BookOpen size={16} /> Capabilities & Limitations
        </button>

      </nav>

      {/* Tab Content Display */}
      <main>
        {activeTab === 'primitives' && <PrimitivesTab />}
        {activeTab === 'auth' && <AuthManagerTab />}
        {activeTab === 'ratelimit' && <RateLimiterTab />}
        {activeTab === 'mcp' && <MCPSpecsTab />}
        {activeTab === 'capabilities' && <CapabilitiesTab />}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.8125rem', color: '#6b7280' }}>
        WooCommerce Connector for Agent Studio • OAuth 2.0 / API Key Auth • Sliding Window Rate Limiter • Model Context Protocol Compliant
      </footer>

    </div>
  );
};

export default App;
