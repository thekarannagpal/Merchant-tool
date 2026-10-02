import { MCPToolSpec } from '../types/connector';

export const WOOCOMMERCE_MCP_TOOLS: MCPToolSpec[] = [
  {
    name: 'woocommerce_list_orders',
    description:
      'Retrieve a paginated list of WooCommerce orders with optional filters for order status (pending, processing, on-hold, completed, cancelled, refunded), customer ID, date range, or search string.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1,
        },
        per_page: {
          type: 'integer',
          description: 'Number of orders per page (1-100, default: 10)',
          default: 10,
        },
        status: {
          type: 'string',
          description: 'Filter orders by status',
          enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'any'],
          default: 'any',
        },
        customer: {
          type: 'integer',
          description: 'Filter orders by WooCommerce Customer ID',
        },
        after: {
          type: 'string',
          description: 'Limit response to orders created after a specified ISO 8601 date (e.g., 2026-01-01T00:00:00Z)',
        },
        before: {
          type: 'string',
          description: 'Limit response to orders created before a specified ISO 8601 date (e.g., 2026-03-01T23:59:59Z)',
        },
        search: {
          type: 'string',
          description: 'Search string to match against order ID, customer name, or email',
        },
      },
    },
  },
  {
    name: 'woocommerce_get_order',
    description:
      'Fetch complete details for a specific WooCommerce order by Order ID, including line items, SKUs, line totals, billing/shipping customer addresses, customer notes, tax, and payment status.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: {
          type: 'integer',
          description: 'The unique numeric WooCommerce Order ID (e.g. 9001)',
        },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'woocommerce_search_orders',
    description:
      'Search WooCommerce orders across multiple fields using a query string (matches order ID, customer email, customer full name, product SKU, or product title), with optional date and order total filters.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search text (customer email, customer name, SKU, or order ID)',
        },
        status: {
          type: 'string',
          description: 'Filter by order status',
          enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'any'],
        },
        date_from: {
          type: 'string',
          description: 'Filter orders created on or after date (YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: 'Filter orders created on or before date (YYYY-MM-DD)',
        },
        min_total: {
          type: 'number',
          description: 'Minimum order total amount in store currency',
        },
        max_total: {
          type: 'number',
          description: 'Maximum order total amount in store currency',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'woocommerce_list_inventory',
    description:
      'List catalog products and inventory levels with filtering options for stock status (instock, outofstock, onbackorder), category, low-stock threshold alert, or search string.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1,
        },
        per_page: {
          type: 'integer',
          description: 'Number of products per page (1-100, default: 10)',
          default: 10,
        },
        stock_status: {
          type: 'string',
          description: 'Filter by stock status',
          enum: ['instock', 'outofstock', 'onbackorder'],
        },
        category: {
          type: 'integer',
          description: 'Filter by WooCommerce category ID',
        },
        search: {
          type: 'string',
          description: 'Search product name, description, or SKU',
        },
        sku: {
          type: 'string',
          description: 'Exact product SKU match',
        },
        low_stock: {
          type: 'boolean',
          description: 'Filter for items where stock quantity is at or below the low stock threshold',
        },
      },
    },
  },
  {
    name: 'woocommerce_get_product_inventory',
    description:
      'Fetch detailed inventory status, stock quantity, SKU, regular/sale pricing, weight, dimensions, and categories for a specific WooCommerce Product ID.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'integer',
          description: 'The unique numeric WooCommerce Product ID (e.g. 101)',
        },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'woocommerce_search_inventory',
    description:
      'Search product catalog inventory by text query, SKU, stock status, low-stock alert flag, or price range.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search string to match product name, description, or SKU',
        },
        sku: {
          type: 'string',
          description: 'Filter by exact product SKU',
        },
        stock_status: {
          type: 'string',
          description: 'Filter by stock status',
          enum: ['instock', 'outofstock', 'onbackorder'],
        },
        low_stock_only: {
          type: 'boolean',
          description: 'Limit results to items running low on stock',
        },
        min_price: {
          type: 'number',
          description: 'Minimum unit price filter',
        },
        max_price: {
          type: 'number',
          description: 'Maximum unit price filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'woocommerce_get_inventory_summary',
    description:
      'Retrieve high-level store inventory diagnostic summary: total catalog products, in-stock count, out-of-stock count, on-backorder count, low-stock count, total physical stock units, and estimated catalog valuation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'woocommerce_get_store_metrics',
    description:
      'Retrieve top-level operational merchant dashboard metrics combining total orders, pending/processing orders count, total revenue, average order value, and inventory summary.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
