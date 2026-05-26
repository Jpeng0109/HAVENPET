# HAVENPET Deployment

## GitHub

- Repository: https://github.com/Jpeng0109/HAVENPET

## Vercel (Frontend)

- **Production URL:** https://frontend-alpha-gilt-93.vercel.app
- **Project:** `frontend` (team: joshua's projects)
- **Git:** Connected to `Jpeng0109/HAVENPET` — auto-deploy on push to `main`
- **Root build:** Repo root `vercel.json` builds the `frontend/` Next.js app

### Environment variables (Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public URL of the NestJS API (e.g. `https://your-api.railway.app/api`) |

The API is **not** deployed on Vercel (NestJS + PostgreSQL). Deploy `backend/` to Railway, Render, or a VPS, then set `NEXT_PUBLIC_API_URL` in Vercel → Project → Settings → Environment Variables.

## Local development

```bash
docker compose up -d
cd backend && npm run start:dev
cd frontend && npm run dev
```
