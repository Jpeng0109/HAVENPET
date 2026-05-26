# HAVENPET — Global SCM & Sales System

Supply chain management and B2B sales platform for the HAVENPET pet food brand. Manages overseas stores, multi-warehouse inventory, B2B ordering, international logistics, and financial analytics.

## Architecture

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Frontend | Next.js 14, React, Tailwind CSS, shadcn/ui |
| Backend  | NestJS, Prisma ORM, PostgreSQL             |
| Auth     | JWT + RBAC (`hq_admin`, `store_manager`)   |

## Project Structure

```
HAVENPET/
├── backend/          # NestJS API + Prisma
├── frontend/         # Next.js dashboard (Steps 2–5)
├── docker-compose.yml
└── README.md
```

## Roles

- **HQ Admin** — Global inventory, store CRUD, order fulfillment, analytics
- **Store Manager** — Local dashboard, B2B catalog, payments, logistics tracking

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

API: `http://localhost:3001/api`

### 3. Frontend (HQ Console)

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — login as HQ admin.

**HQ Global Dashboard:** http://localhost:3000/hq/dashboard  
(KPIs, sales trend chart, top SKUs bar chart, store map, leaderboard)

### 4. Default seed users

| Email              | Password   | Role           |
|--------------------|------------|----------------|
| admin@havenpet.com | Admin123!  | hq_admin       |
| store.de@havenpet.com | Store123! | store_manager |

## Implementation Plan

- [x] **Step 1** — Database schema, auth, project structure
- [x] **Step 2** — Product & store CRUD (HQ) + low-stock alerts
- [x] **Step 3** — B2B ordering, multi-currency checkout & payments
- [x] **Step 4** — Fulfillment & logistics timeline
- [x] **Step 5** — Analytics dashboards (GMV, charts, map, leaderboard)

## License

Proprietary — HAVENPET
