# HAVENPET API Structure (REST)

Base URL: `http://localhost:3001/api`

Auth header: `Authorization: Bearer <accessToken>`

## Step 1 — Implemented

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/health` | — | — | Service health |
| POST | `/auth/login` | — | — | Login, returns JWT |
| POST | `/auth/register` | JWT | `hq_admin` | Create store manager or HQ user |
| GET | `/auth/me` | JWT | any | Current user profile |

## Step 2 — Stores & Products (planned)

### HQ — Stores (`/hq/stores`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hq/stores` | List all overseas stores |
| POST | `/hq/stores` | Create store |
| GET | `/hq/stores/:id` | Store detail |
| PATCH | `/hq/stores/:id` | Update store |
| DELETE | `/hq/stores/:id` | Deactivate store |

### HQ — Catalog (`/hq/products`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hq/products` | Products with variants |
| POST | `/hq/products` | Create product + variants |
| PATCH | `/hq/products/:id` | Update product |
| POST | `/hq/products/:id/variants` | Add SKU variant |

### HQ — Inventory (`/hq/inventory`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hq/inventory` | Central warehouse stock |
| POST | `/hq/inventory/batches` | Receive batch (FIFO) |
| PATCH | `/hq/inventory/adjust` | Manual adjustment |

## Step 3 — Store B2B & Payments (planned)

### Store — Catalog & Cart (`/store`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/store/catalog` | HQ catalog with prices in store currency |
| GET | `/store/inventory` | Local retail stock + low-stock flags |
| POST | `/store/orders` | Create draft order from cart |
| POST | `/store/orders/:id/checkout` | Currency conversion, tax/duty estimate |
| POST | `/store/orders/:id/pay` | Card / Stripe / PayPal / wire upload |

### Exchange rates (`/exchange-rates`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/exchange-rates` | Latest rates (USD base) |
| POST | `/hq/exchange-rates/refresh` | Pull from external API (HQ) |

## Step 4 — Fulfillment & Logistics (planned)

### HQ — Orders (`/hq/orders`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hq/orders` | Filter by status / store |
| PATCH | `/hq/orders/:id/status` | State machine transitions |
| POST | `/hq/orders/:id/ship` | Create shipment + tracking |
| POST | `/hq/orders/:id/milestones` | Add logistics milestone |

### Store — Tracking (`/store/orders`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/store/orders` | Order history |
| GET | `/store/orders/:id/timeline` | Visual milestone timeline |

## Step 5 — Analytics (planned)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/hq/analytics/overview` | HQ | GMV, top SKUs, KPIs |
| GET | `/hq/analytics/stores/ranking` | HQ | Store leaderboard |
| GET | `/hq/analytics/map` | HQ | Store geo markers |
| GET | `/store/analytics/dashboard` | Store | Local sales & inventory |

## Order state machine (valid transitions)

```
draft → pending_payment → paid_awaiting_shipment → shipped_in_transit
  → customs_clearance → arrived_at_store → completed

Any (pre-shipped) → cancelled
paid+ → refunded (terminal)
```

## RBAC route prefixes

- `/hq/*` — `hq_admin` only (Nest `RolesGuard` + `Roles(UserRole.hq_admin)`)
- `/store/*` — `store_manager` only; `storeId` from JWT must match resource store
