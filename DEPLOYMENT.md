# HAVENPET Deployment

## Why login shows "Failed to fetch"

The **Vercel site is frontend-only**. Login calls the NestJS API. If the API is not deployed and `BACKEND_URL` is missing, requests fail.

| Environment | What you need |
|-------------|----------------|
| **Local** | `docker compose up -d`, backend on `:3001`, `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001/api` |
| **Vercel** | Backend on Render/Railway + Vercel env vars below |

## GitHub

- Repository: https://github.com/Jpeng0109/HAVENPET

## Vercel (Frontend)

- **Production URL:** https://frontend-alpha-gilt-93.vercel.app
- **Project:** `frontend` (team: joshua's projects)
- **Git:** Connected to `Jpeng0109/HAVENPET` — auto-deploy on push to `main`

### Required environment variables

Set in Vercel → Project → Settings → Environment Variables → **Production**:

| Variable | Example | Notes |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `/api` | Browser calls same-origin `/api/*` |
| `BACKEND_URL` | `https://havenpet-api.onrender.com` | **No** trailing slash; NestJS service URL |

After changing env vars, **redeploy** the frontend (Deployments → Redeploy).

The Next.js route `app/api/[...path]/route.ts` proxies `/api/*` to `BACKEND_URL/api/*` at runtime.

## Render (Backend API)

1. Push this repo to GitHub.
2. In [Render](https://render.com) → **New** → **Blueprint** → connect `Jpeng0109/HAVENPET` (uses root `render.yaml`).
3. Create a **PostgreSQL** database on Render; copy **Internal Database URL** into the web service env as `DATABASE_URL`.
4. Wait for deploy; open `https://<your-service>.onrender.com/api/health`.
5. Set Vercel `BACKEND_URL` to `https://<your-service>.onrender.com` (no `/api` suffix).
6. Redeploy Vercel frontend.

`render.yaml` runs migrations and `prisma db seed` (creates `admin@havenpet.com` / `Admin123!`).

## Local development

```powershell
docker compose up -d
cd backend
npm run start:dev
cd ../frontend
# frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev
```

Open http://localhost:3000/login — credentials: `admin@havenpet.com` / `Admin123!`
