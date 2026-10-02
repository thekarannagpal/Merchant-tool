import axios, { AxiosInstance } from 'axios';
import {
  AuthConfig,
  ListOrdersParams,
  SearchOrdersParams,
  ListInventoryParams,
  SearchInventoryParams,
  WooCommerceOrder,
  WooCommerceProduct,
  InventorySummary,
  StoreMetrics,
} from '../types/connector';
import { AuthManager } from './auth-manager';
import { RateLimiter, RateLimiterOptions } from './rate-limiter';
import { MOCK_ORDERS, MOCK_PRODUCTS } from './mock-data';

export class WooCommerceConnector {
  private authManager: AuthManager;
  private rateLimiter: RateLimiter;
  private axiosInstance: AxiosInstance;

  constructor(config: AuthConfig, rateLimiterOptions?: RateLimiterOptions) {
    this.authManager = new AuthManager(config);
    this.rateLimiter = new RateLimiter(rateLimiterOptions || {});

    this.axiosInstance = axios.create({
      baseURL: `${config.storeUrl.replace(/\/$/, '')}/wp-json/wc/v3`,
      timeout: 12000,
    });
  }

  public getAuthManager(): AuthManager {
    return this.authManager;
  }

  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  // --- Helper to execute HTTP request with auth and rate-limiting ---
  private async executeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const config = this.authManager.getConfig();

    if (config.useMock) {
      // Mock execution wrapper with rate limiter tracking
      return this.rateLimiter.executeWithRateLimit(endpoint, async () => {
        // Simulate minor network latency (30-100ms)
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Delegate to mock handler
        const resultData = this.handleMockRequest<T>(endpoint, params);
        return {
          data: resultData,
          status: 200,
          headers: {
            'x-ratelimit-limit': '60',
            'x-ratelimit-remaining': (this.rateLimiter.getStatus().remaining - 1).toString(),
            'x-ratelimit-reset': (Math.floor(Date.now() / 1000) + 60).toString(),
          },
        };
      });
    }

    const { headers: authHeaders, params: authParams } = this.authManager.getAuthRequestParams();
    const mergedParams = { ...params, ...authParams };

    return this.rateLimiter.executeWithRateLimit(endpoint, async () => {
      const response = await this.axiosInstance.get<T>(endpoint, {
        headers: authHeaders,
        params: mergedParams,
      });
      return {
        data: response.data,
        headers: response.headers as Record<string, any>,
        status: response.status,
      };
    });
  }

  // --- Mock Engine for Sandbox / Offline Testing ---
  private handleMockRequest<T>(endpoint: string, params: Record<string, any>): T {
    const cleanEndpoint = endpoint.split('?')[0];

    // GET /orders
    if (cleanEndpoint === '/orders') {
      let result = [...MOCK_ORDERS];
      if (params.status && params.status !== 'any') {
        result = result.filter((o) => o.status === params.status);
      }
      if (params.customer) {
        result = result.filter((o) => o.customer_id === Number(params.customer));
      }
      if (params.search) {
        const q = String(params.search).toLowerCase();
        result = result.filter(
          (o) =>
            o.id.toString().includes(q) ||
            o.billing.email.toLowerCase().includes(q) ||
            o.billing.first_name.toLowerCase().includes(q) ||
            o.billing.last_name.toLowerCase().includes(q)
        );
      }
      const page = Number(params.page || 1);
      const perPage = Number(params.per_page || 10);
      const start = (page - 1) * perPage;
      return result.slice(start, start + perPage) as unknown as T;
    }

    // GET /orders/:id
    if (cleanEndpoint.startsWith('/orders/')) {
      const orderId = Number(cleanEndpoint.replace('/orders/', ''));
      const found = MOCK_ORDERS.find((o) => o.id === orderId);
      if (!found) throw { status: 404, message: `Order #${orderId} not found` };
      return found as unknown as T;
    }

    // GET /products
    if (cleanEndpoint === '/products') {
      let result = [...MOCK_PRODUCTS];
      if (params.stock_status) {
        result = result.filter((p) => p.stock_status === params.stock_status);
      }
      if (params.sku) {
        result = result.filter((p) => p.sku.toLowerCase() === String(params.sku).toLowerCase());
      }
      if (params.category) {
        result = result.filter((p) => p.categories.some((c) => c.id === Number(params.category)));
      }
      if (params.low_stock) {
        result = result.filter(
          (p) => p.manage_stock && p.stock_quantity !== null && p.stock_quantity <= (p.low_stock_amount || 5)
        );
      }
      if (params.search) {
        const q = String(params.search).toLowerCase();
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      const page = Number(params.page || 1);
      const perPage = Number(params.per_page || 10);
      const start = (page - 1) * perPage;
      return result.slice(start, start + perPage) as unknown as T;
    }

    // GET /products/:id
    if (cleanEndpoint.startsWith('/products/')) {
      const productId = Number(cleanEndpoint.replace('/products/', ''));
      const found = MOCK_PRODUCTS.find((p) => p.id === productId);
      if (!found) throw { status: 404, message: `Product #${productId} not found` };
      return found as unknown as T;
    }

    throw { status: 400, message: `Unsupported mock endpoint: ${endpoint}` };
  }

  // ==========================================
  // --- CONNECTOR PRIMITIVES (READ OPERATIONS) ---
  // ==========================================

  /**
   * Primitive 1: list_orders
   * Paginated list of WooCommerce orders with filters for status, customer ID, date range, ordering.
   */
  public async listOrders(params: ListOrdersParams = {}): Promise<WooCommerceOrder[]> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      per_page: params.per_page || 10,
      order: params.order || 'desc',
      orderby: params.orderby || 'date',
    };

    if (params.status && params.status !== 'any') queryParams.status = params.status;
    if (params.customer) queryParams.customer = params.customer;
    if (params.product) queryParams.product = params.product;
    if (params.after) queryParams.after = params.after;
    if (params.before) queryParams.before = params.before;
    if (params.search) queryParams.search = params.search;

    return this.executeRequest<WooCommerceOrder[]>('/orders', queryParams);
  }

  /**
   * Primitive 2: get_order
   * Retrieve single detailed WooCommerce order by Order ID.
   */
  public async getOrder(orderId: number): Promise<WooCommerceOrder> {
    if (!orderId || orderId <= 0) {
      throw new Error('Invalid order ID provided to getOrder');
    }
    return this.executeRequest<WooCommerceOrder>(`/orders/${orderId}`);
  }

  /**
   * Primitive 3: search_orders
   * Flexible multi-field search across orders by text query, email, SKU, status, price range.
   */
  public async searchOrders(params: SearchOrdersParams): Promise<WooCommerceOrder[]> {
    const query = params.query.trim().toLowerCase();
    const allOrders = await this.listOrders({
      page: 1,
      per_page: 50,
      status: params.status,
    });

    return allOrders.filter((order) => {
      const matchId = order.id.toString() === query || order.id.toString().includes(query);
      const matchEmail = order.billing.email.toLowerCase().includes(query);
      const matchName =
        `${order.billing.first_name} ${order.billing.last_name}`.toLowerCase().includes(query) ||
        `${order.shipping.first_name} ${order.shipping.last_name}`.toLowerCase().includes(query);
      const matchSku = order.line_items.some((item) => item.sku.toLowerCase().includes(query));
      const matchItemName = order.line_items.some((item) => item.name.toLowerCase().includes(query));

      const matchText = !query || matchId || matchEmail || matchName || matchSku || matchItemName;

      const orderTotal = parseFloat(order.total);
      const matchMinTotal = params.min_total !== undefined ? orderTotal >= params.min_total : true;
      const matchMaxTotal = params.max_total !== undefined ? orderTotal <= params.max_total : true;

      let matchDate = true;
      if (params.date_from) {
        matchDate = matchDate && new Date(order.date_created) >= new Date(params.date_from);
      }
      if (params.date_to) {
        matchDate = matchDate && new Date(order.date_created) <= new Date(params.date_to);
      }

      return matchText && matchMinTotal && matchMaxTotal && matchDate;
    });
  }

  /**
   * Primitive 4: list_inventory
   * Paginated retrieval of catalog products & inventory levels with stock status, category, low-stock filter.
   */
  public async listInventory(params: ListInventoryParams = {}): Promise<WooCommerceProduct[]> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      per_page: params.per_page || 10,
      order: params.order || 'desc',
      orderby: params.orderby || 'date',
    };

    if (params.stock_status) queryParams.stock_status = params.stock_status;
    if (params.category) queryParams.category = params.category;
    if (params.search) queryParams.search = params.search;
    if (params.sku) queryParams.sku = params.sku;

    const products = await this.executeRequest<WooCommerceProduct[]>('/products', queryParams);

    if (params.low_stock) {
      return products.filter(
        (p) => p.manage_stock && p.stock_quantity !== null && p.stock_quantity <= (p.low_stock_amount || 5)
      );
    }

    return products;
  }

  /**
   * Primitive 5: get_product_inventory
   * Fetch stock status and item details for a specific Product ID.
   */
  public async getProductInventory(productId: number): Promise<WooCommerceProduct> {
    if (!productId || productId <= 0) {
      throw new Error('Invalid product ID provided to getProductInventory');
    }
    return this.executeRequest<WooCommerceProduct>(`/products/${productId}`);
  }

  /**
   * Primitive 6: search_inventory
   * Search catalog products by SKU, product name, low-stock threshold, price bounds.
   */
  public async searchInventory(params: SearchInventoryParams): Promise<WooCommerceProduct[]> {
    const query = params.query.trim().toLowerCase();
    const allProducts = await this.listInventory({
      page: 1,
      per_page: 50,
      stock_status: params.stock_status,
    });

    return allProducts.filter((product) => {
      const matchSku = params.sku ? product.sku.toLowerCase() === params.sku.toLowerCase() : true;
      const matchQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      const price = parseFloat(product.price || '0');
      const matchMinPrice = params.min_price !== undefined ? price >= params.min_price : true;
      const matchMaxPrice = params.max_price !== undefined ? price <= params.max_price : true;

      let matchLowStock = true;
      if (params.low_stock_only) {
        matchLowStock =
          product.manage_stock && product.stock_quantity !== null && product.stock_quantity <= (product.low_stock_amount || 5);
      }

      return matchSku && matchQuery && matchMinPrice && matchMaxPrice && matchLowStock;
    });
  }

  /**
   * Primitive 7: get_inventory_summary
   * Provides aggregate diagnostic inventory statistics (stock health, low stock count, valuation).
   */
  public async getInventorySummary(): Promise<InventorySummary> {
    const products = await this.listInventory({ page: 1, per_page: 100 });

    let inStock = 0;
    let outOfStock = 0;
    let onBackorder = 0;
    let lowStock = 0;
    let totalUnits = 0;
    let totalValuation = 0;
    const categorySet = new Set<string>();

    products.forEach((p) => {
      const qty = p.stock_quantity || 0;
      const price = parseFloat(p.price || '0');

      if (p.stock_status === 'instock') inStock++;
      if (p.stock_status === 'outofstock') outOfStock++;
      if (p.stock_status === 'onbackorder') onBackorder++;

      if (p.manage_stock && qty <= (p.low_stock_amount || 5)) {
        lowStock++;
      }

      totalUnits += qty;
      totalValuation += qty * price;

      p.categories.forEach((c) => categorySet.add(c.name));
    });

    return {
      total_products: products.length,
      in_stock_count: inStock,
      out_of_stock_count: outOfStock,
      on_backorder_count: onBackorder,
      low_stock_count: lowStock,
      total_stock_units: totalUnits,
      estimated_inventory_value: Math.round(totalValuation * 100) / 100,
      categories_count: categorySet.size,
    };
  }

  /**
   * Primitive 8: get_store_metrics
   * High-level operational store overview combining order statistics & inventory health.
   */
  public async getStoreMetrics(): Promise<StoreMetrics> {
    const orders = await this.listOrders({ page: 1, per_page: 100 });
    const inventorySummary = await this.getInventorySummary();

    let pending = 0;
    let processing = 0;
    let completed = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      if (o.status === 'pending') pending++;
      if (o.status === 'processing') processing++;
      if (o.status === 'completed') completed++;
      if (o.status === 'cancelled') cancelled++;

      if (o.status !== 'cancelled' && o.status !== 'failed' && o.status !== 'trash') {
        totalRevenue += parseFloat(o.total || '0');
      }
    });

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      total_orders: orders.length,
      pending_orders: pending,
      processing_orders: processing,
      completed_orders: completed,
      cancelled_orders: cancelled,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      average_order_value: Math.round(averageOrderValue * 100) / 100,
      inventory_summary: inventorySummary,
    };
  }
}
