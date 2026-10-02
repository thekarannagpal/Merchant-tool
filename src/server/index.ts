import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { WooCommerceConnector } from '../connector/woocommerce-connector';
import { MCPServer } from '../mcp/mcp-server';
import { WOOCOMMERCE_MCP_TOOLS } from '../mcp/mcp-specs';
import { AuthConfig, MCPRequest } from '../types/connector';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global connector instance (starts in Sandbox Mock Mode)
let currentConfig: AuthConfig = {
  type: 'api_key',
  storeUrl: 'https://sandbox.aerogear-store.com',
  apiKey: {
    consumerKey: 'ck_mock_sandbox_key_987654321',
    consumerSecret: 'cs_mock_sandbox_secret_123456789',
    storeUrl: 'https://sandbox.aerogear-store.com',
  },
  useMock: true,
};

let connector = new WooCommerceConnector(currentConfig);
let mcpServer = new MCPServer(connector);

// --- API Routes ---

// Get current Auth & Config
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    config: currentConfig,
    rateLimiterStatus: connector.getRateLimiter().getStatus(),
  });
});

// Update Auth Config & re-initialize connector
app.post('/api/config', async (req: Request, res: Response) => {
  try {
    currentConfig = { ...currentConfig, ...req.body };
    connector = new WooCommerceConnector(currentConfig);
    mcpServer = new MCPServer(connector);

    const authValidation = await connector.getAuthManager().validateCredentials();
    res.json({
      success: true,
      config: currentConfig,
      authValidation,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Validate Credentials
app.post('/api/auth/validate', async (req: Request, res: Response) => {
  try {
    const tempConfig: AuthConfig = req.body;
    const tempConnector = new WooCommerceConnector(tempConfig);
    const result = await tempConnector.getAuthManager().validateCredentials();
    res.json(result);
  } catch (err: any) {
    res.json({ valid: false, message: err.message });
  }
});

// Execute Primitive: list_orders
app.get('/api/primitives/orders', async (req: Request, res: Response) => {
  try {
    const params = req.query as any;
    const orders = await connector.listOrders(params);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Primitive: get_order
app.get('/api/primitives/orders/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await connector.getOrder(id);
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// Execute Primitive: search_orders
app.post('/api/primitives/orders/search', async (req: Request, res: Response) => {
  try {
    const results = await connector.searchOrders(req.body);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Primitive: list_inventory
app.get('/api/primitives/inventory', async (req: Request, res: Response) => {
  try {
    const params = req.query as any;
    const products = await connector.listInventory(params);
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Primitive: get_product_inventory
app.get('/api/primitives/inventory/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await connector.getProductInventory(id);
    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// Execute Primitive: search_inventory
app.post('/api/primitives/inventory/search', async (req: Request, res: Response) => {
  try {
    const results = await connector.searchInventory(req.body);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Primitive: get_inventory_summary
app.get('/api/primitives/inventory-summary', async (req: Request, res: Response) => {
  try {
    const summary = await connector.getInventorySummary();
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Primitive: get_store_metrics
app.get('/api/primitives/store-metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await connector.getStoreMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Rate Limiter Telemetry & Logs
app.get('/api/rate-limit/status', (req: Request, res: Response) => {
  res.json({
    status: connector.getRateLimiter().getStatus(),
    logs: connector.getRateLimiter().getLogs(),
  });
});

// Rate Limiter Traffic Simulator: Triggers a high-volume burst of 15 requests to test 429 rate limit backoff
app.post('/api/rate-limit/simulate-burst', async (req: Request, res: Response) => {
  const count = parseInt(req.body.count || '15', 10);
  const promises: Promise<any>[] = [];

  for (let i = 1; i <= count; i++) {
    promises.push(
      connector.listOrders({ page: 1, per_page: 2 }).catch((e) => ({ error: e.message }))
    );
  }

  const results = await Promise.all(promises);
  res.json({
    success: true,
    triggeredRequests: count,
    rateLimiterStatus: connector.getRateLimiter().getStatus(),
    logs: connector.getRateLimiter().getLogs().slice(0, 20),
    sampleResultsCount: results.length,
  });
});

// MCP Specifications List
app.get('/api/mcp/tools', (req: Request, res: Response) => {
  res.json({
    tools: WOOCOMMERCE_MCP_TOOLS,
  });
});

// JSON-RPC 2.0 MCP Request Handler
app.post('/api/mcp', async (req: Request, res: Response) => {
  const mcpReq = req.body as MCPRequest;
  const mcpRes = await mcpServer.handleRequest(mcpReq);
  res.json(mcpRes);
});

// Read CAPABILITIES.md Document
app.get('/api/docs/capabilities', (req: Request, res: Response) => {
  try {
    const docPath = path.join(process.cwd(), 'CAPABILITIES.md');
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf8');
      res.json({ success: true, content });
    } else {
      res.status(404).json({ success: false, message: 'CAPABILITIES.md file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Express] WooCommerce Agent Studio Connector API listening on http://localhost:${PORT}`);
});
