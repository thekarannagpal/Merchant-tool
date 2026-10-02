import readline from 'readline';
import { WooCommerceConnector } from '../connector/woocommerce-connector';
import { MCPServer } from './mcp-server';
import { AuthConfig } from '../types/connector';

// Default to mock mode for standard stdio startup unless env variables are specified
const storeUrl = process.env.WOOCOMMERCE_STORE_URL || 'https://sandbox.example.com';
const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';

const config: AuthConfig = {
  type: 'api_key',
  storeUrl,
  apiKey: consumerKey ? { consumerKey, consumerSecret, storeUrl } : undefined,
  useMock: !consumerKey,
};

const connector = new WooCommerceConnector(config);
const server = new MCPServer(connector);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const response = await server.handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (err: any) {
    console.log(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      })
    );
  }
});

// Write ready signal to stderr so stdin/stdout remain clean JSON-RPC channel
process.stderr.write('WooCommerce Agent Studio MCP Server listening on stdio...\n');
