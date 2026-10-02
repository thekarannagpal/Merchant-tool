import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, ShieldCheck, AlertTriangle, Copy, Check } from 'lucide-react';

export const CapabilitiesTab: React.FC = () => {
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchCapabilitiesDoc();
  }, []);

  const fetchCapabilitiesDoc = async () => {
    try {
      const res = await fetch('/api/docs/capabilities');
      const data = await res.json();
      if (data.content) {
        setDocContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load CAPABILITIES.md', err);
    } finally {
      setLoading(false);
    }
  };

  const copyDoc = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header bar for Capabilities Doc */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#6366f1" /> Agent Capabilities & Limitations Document (CAPABILITIES.md)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
            Formal specification of what Agent Studio agents CAN and CANNOT perform using this connector.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={copyDoc}>
          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          {copied ? 'Copied Document' : 'Copy CAPABILITIES.md'}
        </button>
      </div>

      {/* Quick Matrix Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* What Agent CAN Do Card */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#6ee7b7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#10b981" /> What the Agent CAN Do (Capabilities)
          </h3>
          <ul style={{ fontSize: '0.8125rem', color: '#e5e7eb', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>List & search orders with status, date, and customer filters (`woocommerce_list_orders`)</li>
            <li>Retrieve line items, billing/shipping addresses, SKUs, and totals (`woocommerce_get_order`)</li>
            <li>Search orders across email, customer name, order ID, and SKU (`woocommerce_search_orders`)</li>
            <li>List catalog products with stock status (`instock`, `outofstock`) (`woocommerce_list_inventory`)</li>
            <li>Inspect product stock counts, dimensions, pricing, and variation SKUs (`woocommerce_get_product_inventory`)</li>
            <li>Search product inventory by title, SKU, or low-stock threshold (`woocommerce_search_inventory`)</li>
            <li>Generate store inventory health diagnostic metrics (`woocommerce_get_inventory_summary`)</li>
            <li>Retrieve operational store metrics: AOV, total revenue, order count (`woocommerce_get_store_metrics`)</li>
          </ul>
        </div>

        {/* What Agent CANNOT Do Card */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fca5a5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#f43f5e" /> What the Agent CANNOT Do (Limitations)
          </h3>
          <ul style={{ fontSize: '0.8125rem', color: '#e5e7eb', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>NO State Mutations:</strong> Cannot modify order statuses (e.g. change processing to completed)</li>
            <li><strong>NO Inventory Restocking:</strong> Cannot update stock quantities or edit product listings</li>
            <li><strong>NO Refunds:</strong> Cannot trigger payment gateway refunds, reversals, or store credit</li>
            <li><strong>NO Raw Payment Data:</strong> Credit card numbers & CVVs are never accessible or stored</li>
            <li><strong>NO User Deletion:</strong> Cannot delete WordPress user accounts or alter store security keys</li>
            <li><strong>Rate Limit Boundaries:</strong> Throttled at server bucket limits with automatic exponential backoff</li>
          </ul>
        </div>

      </div>

      {/* Full Markdown Viewer */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '16px' }}>
          Raw Document View (CAPABILITIES.md)
        </h3>
        {loading ? (
          <div style={{ color: '#9ca3af', padding: '20px' }}>Loading documentation...</div>
        ) : (
          <pre className="code-block" style={{ maxHeight: '500px', overflowY: 'auto', fontSize: '0.85rem' }}>
            {docContent}
          </pre>
        )}
      </div>

    </div>
  );
};
