import { WooCommerceConnector } from '../connector/woocommerce-connector';
import { WOOCOMMERCE_MCP_TOOLS } from './mcp-specs';
import { MCPRequest, MCPResponse } from '../types/connector';

export class MCPServer {
  private connector: WooCommerceConnector;

  constructor(connector: WooCommerceConnector) {
    this.connector = connector;
  }

  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { jsonrpc, id, method, params } = request;

    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: id || null as any,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      };
    }

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'woocommerce-agent-studio-connector',
                version: '1.0.0',
              },
            },
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: WOOCOMMERCE_MCP_TOOLS,
            },
          };

        case 'tools/call':
          return await this.handleToolCall(id, params);

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: `Internal error: ${err.message || String(err)}` },
      };
    }
  }

  private async handleToolCall(id: string | number, params: any): Promise<MCPResponse> {
    if (!params || !params.name) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Invalid params: missing tool name' },
      };
    }

    const name = params.name;
    const args = params.arguments || {};

    let toolResult: any;

    switch (name) {
      case 'woocommerce_list_orders':
        toolResult = await this.connector.listOrders(args);
        break;

      case 'woocommerce_get_order':
        if (!args.order_id) {
          throw new Error('Argument order_id is required');
        }
        toolResult = await this.connector.getOrder(Number(args.order_id));
        break;

      case 'woocommerce_search_orders':
        if (!args.query) {
          throw new Error('Argument query is required');
        }
        toolResult = await this.connector.searchOrders(args);
        break;

      case 'woocommerce_list_inventory':
        toolResult = await this.connector.listInventory(args);
        break;

      case 'woocommerce_get_product_inventory':
        if (!args.product_id) {
          throw new Error('Argument product_id is required');
        }
        toolResult = await this.connector.getProductInventory(Number(args.product_id));
        break;

      case 'woocommerce_search_inventory':
        if (!args.query) {
          throw new Error('Argument query is required');
        }
        toolResult = await this.connector.searchInventory(args);
        break;

      case 'woocommerce_get_inventory_summary':
        toolResult = await this.connector.getInventorySummary();
        break;

      case 'woocommerce_get_store_metrics':
        toolResult = await this.connector.getStoreMetrics();
        break;

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Unknown tool name: ${name}` },
        };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolResult, null, 2),
          },
        ],
      },
    };
  }
}
