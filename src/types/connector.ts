/**
 * WooCommerce Connector for Agent Studio - Data Types & Interfaces
 */

// --- Authentication Types ---
export type AuthType = 'api_key' | 'oauth2';

export interface ApiKeyCredentials {
  consumerKey: string;
  consumerSecret: string;
  storeUrl: string;
}

export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  storeUrl: string;
  authUrl?: string;
  tokenUrl?: string;
  scope?: string;
}

export interface AuthConfig {
  type: AuthType;
  storeUrl: string;
  apiKey?: ApiKeyCredentials;
  oauth2?: OAuth2Credentials;
  useMock?: boolean;
}

export interface AuthValidationResult {
  valid: boolean;
  message: string;
  storeName?: string;
  woocommerceVersion?: string;
  authenticatedAs?: string;
}

// --- WooCommerce Core Domain Models ---

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface LineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  sku: string;
  price: number;
  image?: {
    id: number;
    src: string;
  };
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'trash'
  | 'any';

export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: OrderStatus;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_paid: string | null;
  cart_hash: string;
  line_items: LineItem[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductImage {
  id: number;
  date_created: string;
  src: string;
  name: string;
  alt: string;
}

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: StockStatus;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: ProductImage[];
  attributes: ProductAttribute[];
  variations: number[];
}

// --- Query Parameters for Primitives ---

export interface ListOrdersParams {
  page?: number;
  per_page?: number;
  status?: OrderStatus;
  customer?: number;
  product?: number;
  after?: string;
  before?: string;
  search?: string;
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
  order?: 'asc' | 'desc';
}

export interface SearchOrdersParams {
  query: string;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
  page?: number;
  per_page?: number;
}

export interface ListInventoryParams {
  page?: number;
  per_page?: number;
  stock_status?: StockStatus;
  category?: number;
  search?: string;
  sku?: string;
  low_stock?: boolean;
  orderby?: 'date' | 'id' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
}

export interface SearchInventoryParams {
  query: string;
  sku?: string;
  category?: string;
  stock_status?: StockStatus;
  low_stock_only?: boolean;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export interface InventorySummary {
  total_products: number;
  in_stock_count: number;
  out_of_stock_count: number;
  on_backorder_count: number;
  low_stock_count: number;
  total_stock_units: number;
  estimated_inventory_value: number;
  categories_count: number;
}

export interface StoreMetrics {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  inventory_summary: InventorySummary;
}

// --- Rate Limiter Types ---

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetSeconds: number;
  isThrottled: boolean;
  activeBackoffMs: number;
  totalRequests: number;
  throttledRequests: number;
  retriedRequests: number;
}

export interface RateLimitEvent {
  timestamp: string;
  type: 'REQUEST' | 'SUCCESS' | 'THROTTLED' | 'RETRY' | 'BACKOFF' | 'FAILED';
  endpoint: string;
  statusCode?: number;
  delayMs?: number;
  attempt?: number;
  remainingTokens?: number;
  message: string;
}

// --- MCP Specification Types ---

export interface MCPToolProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: MCPToolProperty;
  default?: any;
}

export interface MCPToolInputSchema {
  type: 'object';
  properties: Record<string, MCPToolProperty>;
  required?: string[];
}

export interface MCPToolSpec {
  name: string;
  description: string;
  inputSchema: MCPToolInputSchema;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
