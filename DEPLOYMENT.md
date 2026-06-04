# HAVENPET Deployment

## Fix: "API is not connected"

Vercel only hosts the **frontend**. Login needs the **NestJS API** on Render (or similar) plus `BACKEND_URL` on Vercel.

---

## Step 1 — Deploy API on Render (about 10 minutes)

1. Open **[Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint)** and sign in with GitHub.
2. Select repo **`Jpeng0109/HAVENPET`**.
3. Render reads root `render.yaml` and creates:
   - PostgreSQL database `havenpet-db`
   - Web service `havenpet-api`
4. Click **Apply** and wait until the web service status is **Live** (first deploy can take 5–10 min on free tier).
5. Copy the service URL, e.g. `https://havenpet-api-xxxx.onrender.com` (no trailing slash).
6. Verify in browser: `https://YOUR-URL.onrender.com/api/health` → should return JSON like `{"status":"ok"}`.

> Free Render services sleep after inactivity; the first request after sleep may take ~30s.

### Render build failed with exit 127?

`NODE_ENV=production` makes `npm install` skip devDependencies, so `nest` / `prisma` are missing. The repo `render.yaml` uses `npm install --include=dev` in the build command to fix this. After pulling latest `main`, click **Manual Deploy → Deploy latest commit** on `havenpet-api`.

---

## Step 2 — Connect Vercel to the API

### Option A — Script (Windows)

```powershell
cd C:\Users\工作站1\Desktop\coding\HAVENPET
.\scripts\set-vercel-backend.ps1 -BackendUrl "https://havenpet-api-xxxx.onrender.com"
```

### Option B — Vercel Dashboard

1. [Vercel → frontend project → Settings → Environment Variables](https://vercel.com)
2. Add **Production** variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `/api` |
| `BACKEND_URL` | `https://havenpet-api-xxxx.onrender.com` |

3. **Deployments → Redeploy** latest production build.

---

## Step 3 — Test login

- URL: https://frontend-alpha-gilt-93.vercel.app/login  
- **HQ Admin:** `admin@havenpet.com` / `Admin123!`  
- Seed runs automatically on Render deploy (`prisma db seed`).

---

## Local development

```powershell
docker compose up -d
cd backend
npm run start:dev
cd ../frontend
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev
```

Open http://localhost:3000/login

---

## Links

| Service | URL |
|---------|-----|
| GitHub | https://github.com/Jpeng0109/HAVENPET |
| Vercel (frontend) | https://frontend-alpha-gilt-93.vercel.app |
| Render dashboard | https://dashboard.render.com |
