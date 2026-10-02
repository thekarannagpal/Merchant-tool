# Agent Studio WooCommerce Connector — Capabilities & Limitations

This document defines the operational scope, capabilities, and boundaries for AI Agents powered by Agent Studio using the WooCommerce Connector.

---

## 1. Overview & Architecture
The WooCommerce Connector provides Agent Studio agents with secure read-only access to store orders, customer context, catalog inventory, stock levels, and diagnostic metrics via WooCommerce REST API v3 or OAuth 2.0.

---

## 2. Capabilities (What the Agent CAN Do)

### A. Order Management & Tracking
- **List Orders (`woocommerce_list_orders`)**: Retrieve paginated list of store orders filtered by status (`pending`, `processing`, `on-hold`, `completed`, `cancelled`, `refunded`), customer ID, date ranges (`after`, `before`), or search string.
- **Inspect Order Details (`woocommerce_get_order`)**: Inspect full order breakdown including line items, product SKUs, quantities, unit prices, billing/shipping addresses, tax totals, shipping methods, customer notes, and payment status.
- **Multi-Criteria Order Search (`woocommerce_search_orders`)**: Locate orders using fuzzy matching across order IDs, customer emails, customer names, SKUs, price thresholds (`min_total`, `max_total`), and creation date ranges.

### B. Inventory & Catalog Intelligence
- **List Catalog & Stock (`woocommerce_list_inventory`)**: Retrieve store products with real-time stock status (`instock`, `outofstock`, `onbackorder`), low-stock alert filters, and categories.
- **Inspect Product SKU (`woocommerce_get_product_inventory`)**: Fetch exact stock counts, low-stock threshold triggers, pricing (regular vs sale), item weight, dimensions, and variation parameters.
- **Search Inventory (`woocommerce_search_inventory`)**: Search products by title, SKU, low-stock urgency, stock status, or price boundaries.
- **Inventory Health Diagnostics (`woocommerce_get_inventory_summary`)**: Generate high-level summaries of total store SKUs, total physical stock units, low-stock count, out-of-stock items, and total catalog valuation.

### C. Merchant Analytics & Store Health
- **Store Overview Metrics (`woocommerce_get_store_metrics`)**: Provide high-level operational metrics combining revenue, order count by status, average order value (AOV), and inventory health.

### D. Rate-Limiting & Fault Tolerance
- **Automatic Exponential Backoff & Jitter**: Intercepts HTTP 429 (`Too Many Requests`) responses and automatically backs off with randomized full jitter to prevent thundering herds.
- **Header Tracking**: Respects `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` HTTP headers.

---

## 3. Limitations & Boundaries (What the Agent CANNOT Do)

### A. Write & State Mutations (Strict Read-Only Enforcement)
- **NO Order Status Modifications**: The agent **cannot** update order statuses (e.g. change `processing` to `completed` or `cancelled`).
- **NO Stock Adjustments**: The agent **cannot** update stock quantities, decrement inventory, or restock items.
- **NO Product/Catalog Edits**: The agent **cannot** create, modify, or delete products, prices, images, or categories.
- **NO Customer Data Mutations**: The agent **cannot** alter customer addresses, contact details, or account permissions.

### B. Financial & Refund Operations
- **NO Automatic Refund Issuance**: The agent **cannot** trigger gateway refunds, process PayPal/Stripe reversals, or write credit memos.
- **NO Payment Method Modification**: The agent **cannot** process direct credit cards, store CVVs, or charge payment methods.

### C. Security & Sensitive PII Boundaries
- **NO Raw Payment Details Access**: WooCommerce API does not expose raw credit card numbers or secret tokens; the agent only sees redacted transaction IDs.
- **NO User Account Deletion**: The agent cannot delete WordPress user accounts or modify store API keys/passwords.

### D. Technical & API Rate Limits
- **Subject to Rate Limits**: Requests are throttled according to store web server / Cloudflare limits (default rate limit bucket is 60 requests/minute).
- **Max Items Per Request**: Paginated endpoints cap at 100 items per single API call. Large queries require page iteration.
- **Historical Logs**: Historical data depends on WooCommerce store retention settings. Deleted or trashed orders are excluded by default unless explicitly filtered.

---

## 4. Operational Matrix Summary

| Action / Primitive | Permitted? | Notes |
| :--- | :--- | :--- |
| Read Orders & Line Items | ✅ **YES** | Read-only |
| Search Orders by Customer / SKU | ✅ **YES** | Multi-field search |
| Check Real-Time Stock Levels | ✅ **YES** | Includes low-stock alerts |
| Get Store Revenue & Metrics | ✅ **YES** | Aggregate operational summary |
| Cancel or Fulfill Orders | ❌ **NO** | Requires write scope (disabled) |
| Update Stock Quantities | ❌ **NO** | Requires inventory write endpoint |
| Issue Refunds | ❌ **NO** | Financial safety guardrail |
| Access Credit Card / CVV | ❌ **NO** | Never stored or exposed |

---

## 5. Security & Scope Enforcement
The connector operates under **Read-Only API Keys** (`read` scope) or **OAuth 2.0 Read Scopes**. Any attempt to issue a write operation (`POST`, `PUT`, `DELETE`) will be blocked at the connector level.
