import React, { useState, useEffect } from 'react';
import {
  List,
  Search,
  Box,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Play,
  Copy,
  Check,
  FileText,
  BarChart3,
  Tag,
} from 'lucide-react';
import { OrderStatus, StockStatus } from '../../types/connector';

export const PrimitivesTab: React.FC = () => {
  const [activePrimitive, setActivePrimitive] = useState<string>('list_orders');
  const [loading, setLoading] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form Inputs
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('any');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('Elena');
  const [orderIdInput, setOrderIdInput] = useState<number>(9001);

  const [stockStatus, setStockStatus] = useState<StockStatus | 'all'>('all');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('Headphones');
  const [productIdInput, setProductIdInput] = useState<number>(101);
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Auto-execute default primitive on mount
  useEffect(() => {
    executeSelectedPrimitive(activePrimitive);
  }, [activePrimitive]);

  const executeSelectedPrimitive = async (primitiveName: string) => {
    setLoading(true);
    setResponseData(null);
    const startTime = performance.now();

    try {
      let url = '';
      let method = 'GET';
      let body: any = null;

      switch (primitiveName) {
        case 'list_orders':
          url = `/api/primitives/orders?status=${orderStatus}&page=1&per_page=10`;
          break;
        case 'get_order':
          url = `/api/primitives/orders/${orderIdInput}`;
          break;
        case 'search_orders':
          url = `/api/primitives/orders/search`;
          method = 'POST';
          body = { query: orderSearchQuery, status: orderStatus !== 'any' ? orderStatus : undefined };
          break;
        case 'list_inventory':
          url = `/api/primitives/inventory?page=1&per_page=10${stockStatus !== 'all' ? `&stock_status=${stockStatus}` : ''}${lowStockOnly ? '&low_stock=true' : ''}`;
          break;
        case 'get_product_inventory':
          url = `/api/primitives/inventory/${productIdInput}`;
          break;
        case 'search_inventory':
          url = `/api/primitives/inventory/search`;
          method = 'POST';
          body = { query: inventorySearchQuery, low_stock_only: lowStockOnly };
          break;
        case 'get_inventory_summary':
          url = `/api/primitives/inventory-summary`;
          break;
        case 'get_store_metrics':
          url = `/api/primitives/store-metrics`;
          break;
      }

      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(url, options);
      const data = await res.json();

      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setResponseData(data);
    } catch (err: any) {
      setResponseData({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      
      {/* Left Menu: Primitive Selector */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '14px' }}>
          Read Primitives
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, paddingLeft: '4px', marginTop: '4px' }}>
            ORDERS API
          </div>
          
          <button
            className={`btn ${activePrimitive === 'list_orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('list_orders')}
          >
            <List size={16} /> list_orders
          </button>
          
          <button
            className={`btn ${activePrimitive === 'get_order' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('get_order')}
          >
            <FileText size={16} /> get_order
          </button>

          <button
            className={`btn ${activePrimitive === 'search_orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('search_orders')}
          >
            <Search size={16} /> search_orders
          </button>

          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600, paddingLeft: '4px', marginTop: '12px' }}>
            INVENTORY API
          </div>

          <button
            className={`btn ${activePrimitive === 'list_inventory' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('list_inventory')}
          >
            <Box size={16} /> list_inventory
          </button>

          <button
            className={`btn ${activePrimitive === 'get_product_inventory' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('get_product_inventory')}
          >
            <Tag size={16} /> get_product_inventory
          </button>

          <button
            className={`btn ${activePrimitive === 'search_inventory' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('search_inventory')}
          >
            <Search size={16} /> search_inventory
          </button>

          <button
            className={`btn ${activePrimitive === 'get_inventory_summary' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('get_inventory_summary')}
          >
            <BarChart3 size={16} /> get_inventory_summary
          </button>

          <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, paddingLeft: '4px', marginTop: '12px' }}>
            STORE METRICS API
          </div>

          <button
            className={`btn ${activePrimitive === 'get_store_metrics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActivePrimitive('get_store_metrics')}
          >
            <BarChart3 size={16} /> get_store_metrics
          </button>

        </div>
      </div>

      {/* Right Column: Execution Controls & Formatted Payload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Input Parameters Controls Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6' }}>
                Primitive: <code style={{ color: '#818cf8' }}>{activePrimitive}</code>
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                Configure parameters and click run to simulate Agent Studio execution.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => executeSelectedPrimitive(activePrimitive)}
              disabled={loading}
            >
              <Play size={16} /> {loading ? 'Executing...' : 'Run Primitive'}
            </button>
          </div>

          {/* Conditional Inputs Based on Primitive */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            
            {(activePrimitive === 'list_orders' || activePrimitive === 'search_orders') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Filter by Status
                </label>
                <select
                  className="input-field"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                >
                  <option value="any">any (All Statuses)</option>
                  <option value="processing">processing</option>
                  <option value="completed">completed</option>
                  <option value="on-hold">on-hold</option>
                  <option value="pending">pending</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            )}

            {activePrimitive === 'get_order' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  WooCommerce Order ID
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(Number(e.target.value))}
                  placeholder="e.g. 9001"
                />
              </div>
            )}

            {activePrimitive === 'search_orders' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Search Query (Name, Email, SKU, Order ID)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="e.g. Elena or AUDIO-AER-001"
                />
              </div>
            )}

            {(activePrimitive === 'list_inventory' || activePrimitive === 'search_inventory') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Stock Status Filter
                </label>
                <select
                  className="input-field"
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as any)}
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="instock">instock</option>
                  <option value="outofstock">outofstock</option>
                  <option value="onbackorder">onbackorder</option>
                </select>
              </div>
            )}

            {activePrimitive === 'get_product_inventory' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Product ID
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(Number(e.target.value))}
                  placeholder="e.g. 101"
                />
              </div>
            )}

            {activePrimitive === 'search_inventory' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Search Query (Title, SKU, Description)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  placeholder="e.g. Headphones or AUDIO-AER-001"
                />
              </div>
            )}

            {(activePrimitive === 'list_inventory' || activePrimitive === 'search_inventory') && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                  />
                  Show Low Stock Items Only
                </label>
              </div>
            )}

          </div>
        </div>

        {/* Output Results Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f3f4f6' }}>Execution Result</h3>
              {executionTime !== null && (
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {executionTime} ms
                </span>
              )}
            </div>

            {responseData && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(JSON.stringify(responseData, null, 2))}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Executing request via Rate-Limiter pipeline...
            </div>
          ) : (
            <div>
              <pre className="code-block">
                {responseData ? JSON.stringify(responseData, null, 2) : '// Click Run Primitive to fetch payload'}
              </pre>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
