# HAVENPET API Structure

Base URL: `http://localhost:3001/api`  
Swagger: `http://localhost:3001/api/docs`

## Step 1 — Auth

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/health` | — | — | Health check |
| POST | `/auth/login` | — | — | Login, returns JWT + refresh token |
| POST | `/auth/register` | Bearer | `hq_admin` | Create user |
| POST | `/auth/refresh` | — | — | Rotate refresh token |
| GET | `/auth/me` | Bearer | any | Current user profile |

## Step 2 — Implemented

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/stores` | any | List stores (store manager: own only) |
| GET | `/stores/:id` | any | Get store |
| POST | `/stores` | `hq_admin` | Create store |
| PATCH | `/stores/:id` | `hq_admin` | Update store |
| DELETE | `/stores/:id` | `hq_admin` | Soft-deactivate store |
| GET | `/products` | any | List products with SKUs |
| GET | `/products/:id` | any | Get product |
| POST | `/products` | `hq_admin` | Create product |
| PATCH | `/products/:id` | `hq_admin` | Update product |
| DELETE | `/products/:id` | `hq_admin` | Deactivate product |
| POST | `/products/:id/skus` | `hq_admin` | Add SKU (+ optional HQ stock) |
| PATCH | `/products/:pid/skus/:sid` | `hq_admin` | Update SKU |
| DELETE | `/products/:pid/skus/:sid` | `hq_admin` | Deactivate SKU |
| GET | `/inventory` | any | List inventory (filter by store/warehouse) |
| GET | `/inventory/low-stock` | any | Low-stock alerts |

## Step 3 — Implemented

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/catalog` | `store_manager` | HQ catalog with local FX prices |
| GET | `/exchange-rates/:currency` | any | USD → target rate |
| POST | `/exchange-rates/refresh` | `hq_admin` | Refresh rates from API |
| POST | `/orders/preview` | `store_manager` | Tax/duty/shipping breakdown |
| POST | `/orders` | `store_manager` | Create draft order |
| POST | `/orders/restock/:skuId` | `store_manager` | One-click restock from low-stock |
| GET | `/orders` | any | List orders |
| GET | `/orders/:id` | any | Order detail |
| POST | `/orders/:id/submit` | `store_manager` | Draft → pending_payment |
| POST | `/orders/:id/cancel` | any | Cancel draft/pending |
| POST | `/payments` | `store_manager` | Pay (card/stripe/paypal/wire) |
| GET | `/payments/pending-wire` | `hq_admin` | Pending wire transfers |
| POST | `/payments/:id/approve` | `hq_admin` | Approve wire |
| POST | `/payments/:id/reject` | `hq_admin` | Reject wire |

## Step 4 — Implemented

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/shipments/fulfillment` | `hq_admin` | Orders awaiting pack/ship |
| GET | `/shipments/track/:orderId` | any | Shipment + visual timeline |
| POST | `/shipments/ship` | `hq_admin` | Create shipment, mark in transit |
| PATCH | `/shipments/:shipmentId` | `hq_admin` | Update tracking details |
| POST | `/shipments/:orderId/milestones` | `hq_admin` | Add custom milestone |
| POST | `/shipments/:orderId/advance` | `hq_admin` | Advance order status + milestone |

Status flow: `paid` → **ship** → `shipped_in_transit` → `customs_clearance` → `arrived_at_store` → `completed` (stock transferred to store).

## Step 5 — Implemented

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/analytics/overview` | `hq_admin` | GMV KPIs, sales trend, top SKUs, store map & leaderboard |

## All core modules complete

```
/api
├── auth/           ✓
├── stores/         ✓
├── products/       ✓
├── inventory/      ✓
├── orders/         ✓
├── payments/       ✓
├── shipments/      ✓
└── analytics/      ✓
```

## Auth headers

```
Authorization: Bearer <accessToken>
```

## Guards pattern (all protected routes)

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.hq_admin)
```

Store-scoped routes additionally verify `user.storeId === resource.storeId`.
