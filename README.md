# 🛒 WooCommerce Connector for Agent Studio

<div align="center">

![WooCommerce Connector Banner](https://img.shields.io/badge/Agent%20Studio-Connector-6366f1?style=for-the-badge&logo=probot&logoColor=white)
![MCP Compliant](https://img.shields.io/badge/MCP-1.0%20Compliant-06b6d4?style=for-the-badge&logo=json&logoColor=white)
![Authentication](https://img.shields.io/badge/Auth-OAuth2%20%7C%20API--Key-a855f7?style=for-the-badge&logo=keycdn&logoColor=white)
![Rate Limiting](https://img.shields.io/badge/Rate--Limiting-Exponential%20Backoff-10b981?style=for-the-badge&logo=speedtest&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

**An enterprise-grade, high-performance connector enabling AI agents powered by Agent Studio to seamlessly read orders, inventory, catalog SKUs, and diagnostic store metrics from WooCommerce.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [MCP Specification](#-mcp-specification--agent-studio-setup) • [Primitives Reference](#-primitives-reference) • [Rate Limiting](#-rate-limiting--resilience) • [Capabilities Document](#-capabilities--limitations)

</div>

---

## 🚀 Key Features

- 🔐 **Dual Authentication Architecture (`AuthManager`)**
  - **API Key Mode**: Supports Consumer Key (`ck_...`) and Consumer Secret (`cs_...`) via HTTP Basic or query signature.
  - **OAuth 2.0 Flow**: Complete Authorization Code exchange, refresh token management, and session token storage.
  - **Handshake Verification**: Instant credentials validation endpoint checking store version and scope permissions.

- 📦 **Comprehensive Read Primitives**
  - **Orders**: Paginated listing, multi-criteria fuzzy search, detailed order inspection (line items, SKUs, line totals, billing/shipping addresses, tax breakdown, customer notes).
  - **Inventory & Catalog**: Paginated stock listing, stock status tracking (`instock`, `outofstock`, `onbackorder`), product search by SKU or title, and low-stock alert filtering.
  - **Diagnostic Metrics**: Inventory valuation calculations, stock health summaries, revenue metrics, and Average Order Value (AOV).

- ⚡ **Rate Limit Protection & Resilience (`RateLimiter`)**
  - **Token Bucket Limiter**: Client-side sliding-window bucket preventing store rate limit exhaustion.
  - **Header Parsing**: Automatic parsing of `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.
  - **Exponential Backoff & Full Jitter**: Intercepts HTTP 429 (`Too Many Requests`) and retries with randomized backoff delay ($\text{delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}}) \times (0.5 + 0.5 \times \text{random}())$).
  - **Live Telemetry Stream**: Real-time event logger emitting `REQUEST`, `SUCCESS`, `THROTTLED`, `BACKOFF`, and `FAILED` events.

- 🤖 **Standard Model Context Protocol (MCP 1.0) Specification**
  - Standard JSON Schema tool definitions for Agent Studio agents.
  - Built-in JSON-RPC 2.0 Stdio/HTTP Server implementation (`MCPServer`).

- 📊 **Interactive Visual Testing Studio**
  - Built with React, Vite, and Express featuring a dark-mode glassmorphism design system.
  - Allows live testing of primitives, authentication, rate limit traffic bursts, and MCP RPC calls out-of-the-box in mock sandbox mode or connected to a live WooCommerce store.

---

## 🏗️ System Architecture

```
                                    ┌────────────────────────────────┐
                                    │    Agent Studio / AI Agent     │
                                    └───────────────┬────────────────┘
                                                    │ Standard MCP / JSON-RPC
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           WooCommerce Agent Studio Connector                            │
│                                                                                         │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌──────────────────────────┐  │
│  │   AuthManager         │   │   RateLimiter          │   │   MCPServer              │  │
│  │  • API Key (ck/cs)    │   │  • Token Bucket        │   │  • MCP 1.0 Schemas       │  │
│  │  • OAuth 2.0 Flow     │   │  • 429 Backoff+Jitter  │   │  • JSON-RPC Handler      │  │
│  └───────────┬───────────┘   └───────────┬────────────┘   └────────────┬─────────────┘  │
│              │                           │                             │                │
│              └───────────────────────────┼─────────────────────────────┘                │
│                                          ▼                                              │
│                          ┌───────────────────────────────┐                              │
│                          │  WooCommerceConnector Engine  │                              │
│                          └───────────────┬───────────────┘                              │
└──────────────────────────────────────────┼──────────────────────────────────────────────┘
                                           │ HTTPS REST API v3 / Sandbox Proxy
                                           ▼
                            ┌─────────────────────────────┐
                            │    WooCommerce Store API    │
                            └─────────────────────────────┘
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/thekarannagpal/Merchant-tool.git
cd Merchant-tool
npm install
```

### 3. Start Development Servers
```bash
# Terminal 1: Start Express API Backend (Port 3001)
npm run server

# Terminal 2: Start Interactive Visual Dashboard (Port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ MCP Specification & Agent Studio Setup

To connect this tool to **Agent Studio**, Claude Desktop, or any MCP-compliant framework, add the following configuration to your `mcpServers` settings:

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["tsx", "<PATH_TO_PROJECT>/src/mcp/cli.ts"],
      "env": {
        "WOOCOMMERCE_STORE_URL": "https://your-woocommerce-store.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_your_consumer_key",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_your_consumer_secret"
      }
    }
  }
}
```

---

## 📋 Primitives Reference

| Tool Name | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `woocommerce_list_orders` | Orders | Retrieve paginated WooCommerce orders | `page`, `per_page`, `status`, `customer`, `after`, `before` |
| `woocommerce_get_order` | Orders | Fetch complete details for a specific order ID | `order_id` (required) |
| `woocommerce_search_orders` | Orders | Fuzzy search orders by email, name, SKU, or order ID | `query` (required), `status`, `min_total`, `max_total` |
| `woocommerce_list_inventory` | Inventory | List catalog products and stock levels | `page`, `per_page`, `stock_status`, `category`, `low_stock` |
| `woocommerce_get_product_inventory` | Inventory | Inspect single product stock details and dimensions | `product_id` (required) |
| `woocommerce_search_inventory` | Inventory | Search product catalog by SKU, name, or low stock alert | `query` (required), `sku`, `stock_status`, `low_stock_only` |
| `woocommerce_get_inventory_summary` | Diagnostic | Calculate catalog stock health, low stock count & valuation | *None* |
| `woocommerce_get_store_metrics` | Analytics | Top-level store overview (Revenue, AOV, Order breakdown) | *None* |

---

## 🔒 Capabilities & Limitations

See full documentation in [CAPABILITIES.md](CAPABILITIES.md).

- ✅ **Permitted Agent Capabilities**:
  - Read-only access to store orders, customer billing/shipping details, line items, and product SKUs.
  - Access to real-time stock levels, low-stock threshold triggers, and inventory health metrics.
  - Aggregate executive metrics (Revenue, AOV, order volume by status).
- ❌ **Operational Limitations & Boundaries**:
  - **Strict Read-Only Enforcement**: The agent cannot update order statuses, edit stock quantities, or alter customer profiles.
  - **Financial Safety**: The agent cannot process payment gateway refunds, write credit memos, or access raw credit card numbers/CVVs.

---

## 🛡️ License

MIT License. Created for Agent Studio integration.
