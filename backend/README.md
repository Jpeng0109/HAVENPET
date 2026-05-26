# HAVENPET Backend

NestJS + Prisma + PostgreSQL.

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## Auth endpoints

- `POST /api/auth/login` — public
- `POST /api/auth/register` — requires `hq_admin` JWT
- `GET /api/auth/me` — requires JWT

## Module layout (Steps 2–5)

```
src/
├── auth/           # Step 1 ✅
├── prisma/
├── health/
├── hq/             # stores, products, inventory, orders (Step 2–4)
├── store/          # catalog, cart, payments, timeline (Step 3–4)
└── common/         # shared guards, FX, order state machine
```
