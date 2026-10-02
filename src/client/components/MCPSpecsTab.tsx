import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Play, Code2, Server } from 'lucide-react';
import { MCPToolSpec, MCPRequest, MCPResponse } from '../../types/connector';

export const MCPSpecsTab: React.FC = () => {
  const [tools, setTools] = useState<MCPToolSpec[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPToolSpec | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [mcpConfigCopied, setMcpConfigCopied] = useState<boolean>(false);

  // Tool Call Tester State
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [mcpResponse, setMcpResponse] = useState<MCPResponse | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  useEffect(() => {
    fetchMCPSpecs();
  }, []);

  const fetchMCPSpecs = async () => {
    try {
      const res = await fetch('/api/mcp/tools');
      const data = await res.json();
      if (data.tools) {
        setTools(data.tools);
        setSelectedTool(data.tools[0]);
        setDefaultArgsForTool(data.tools[0]);
      }
    } catch (err) {
      console.error('Failed to fetch MCP tool specifications', err);
    }
  };

  const setDefaultArgsForTool = (tool: MCPToolSpec) => {
    switch (tool.name) {
      case 'woocommerce_get_order':
        setToolArgs(JSON.stringify({ order_id: 9001 }, null, 2));
        break;
      case 'woocommerce_search_orders':
        setToolArgs(JSON.stringify({ query: 'Elena' }, null, 2));
        break;
      case 'woocommerce_get_product_inventory':
        setToolArgs(JSON.stringify({ product_id: 101 }, null, 2));
        break;
      case 'woocommerce_search_inventory':
        setToolArgs(JSON.stringify({ query: 'Headphones' }, null, 2));
        break;
      default:
        setToolArgs('{}');
        break;
    }
  };

  const selectToolHandler = (tool: MCPToolSpec) => {
    setSelectedTool(tool);
    setDefaultArgsForTool(tool);
    setMcpResponse(null);
  };

  const handleRunMCPTool = async () => {
    if (!selectedTool) return;
    setTesting(true);
    setMcpResponse(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolArgs);
    } catch (e) {
      alert('Invalid JSON syntax in arguments field');
      setTesting(false);
      return;
    }

    const mcpReq: MCPRequest = {
      jsonrpc: '2.0',
      id: `mcp_req_${Date.now()}`,
      method: 'tools/call',
      params: {
        name: selectedTool.name,
        arguments: parsedArgs,
      },
    };

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpReq),
      });

      const data = await res.json();
      setMcpResponse(data);
    } catch (err: any) {
      setMcpResponse({
        jsonrpc: '2.0',
        id: mcpReq.id,
        error: { code: -32603, message: err.message },
      });
    } finally {
      setTesting(false);
    }
  };

  const mcpServerConfigJson = JSON.stringify(
    {
      mcpServers: {
        woocommerce: {
          command: 'npx',
          args: ['tsx', 'd:/Merchant tool/src/mcp/cli.ts'],
          env: {
            WOOCOMMERCE_STORE_URL: 'https://your-store.com',
            WOOCOMMERCE_CONSUMER_KEY: 'ck_your_key',
            WOOCOMMERCE_CONSUMER_SECRET: 'cs_your_secret',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      
      {/* Left Column: Tool Specs Selector & Server Config */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Tool List Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '14px' }}>
            MCP Tool Specifications ({tools.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tools.map((t) => (
              <button
                key={t.name}
                className={`btn ${selectedTool?.name === t.name ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}
                onClick={() => selectToolHandler(t)}
              >
                <Terminal size={14} /> {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* MCP Server Integration Config */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Server size={16} color="#6366f1" /> Agent Studio mcpServers Config
            </h4>
            <button
              className="btn btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              onClick={() => {
                navigator.clipboard.writeText(mcpServerConfigJson);
                setMcpConfigCopied(true);
                setTimeout(() => setMcpConfigCopied(false), 2000);
              }}
            >
              {mcpConfigCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            </button>
          </div>
          <pre className="code-block" style={{ fontSize: '0.7rem' }}>
            {mcpServerConfigJson}
          </pre>
        </div>

      </div>

      {/* Right Column: Selected Tool JSON Schema & JSON-RPC Test Runner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Selected Tool Details & JSON Schema */}
        {selectedTool && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6', fontFamily: 'var(--font-mono)' }}>
                  {selectedTool.name}
                </h2>
                <span className="badge badge-completed" style={{ textTransform: 'none' }}>
                  MCP 1.0 Compliant
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{selectedTool.description}</p>
            </div>

            {/* Input Schema Preview */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e0e7ff', marginBottom: '6px' }}>
                Input Schema (JSON Schema):
              </h4>
              <pre className="code-block" style={{ maxHeight: '200px' }}>
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Live MCP JSON-RPC 2.0 Test Runner */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={18} color="#06b6d4" /> Live JSON-RPC 2.0 MCP Execution Test
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                Tool Arguments (JSON):
              </label>
              <textarea
                className="input-field"
                style={{ height: '140px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                value={toolArgs}
                onChange={(e) => setToolArgs(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '6px' }}>
                JSON-RPC 2.0 Output Payload:
              </label>
              <pre className="code-block" style={{ height: '140px', overflowY: 'auto' }}>
                {mcpResponse ? JSON.stringify(mcpResponse, null, 2) : '// Click "Execute MCP Call" to view RPC result'}
              </pre>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px' }}
            onClick={handleRunMCPTool}
            disabled={testing}
          >
            <Play size={16} /> {testing ? 'Executing MCP Tool Call...' : `Execute MCP Tool (${selectedTool?.name})`}
          </button>
        </div>

      </div>

    </div>
  );
};
