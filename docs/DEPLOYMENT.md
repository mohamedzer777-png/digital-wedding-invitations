# 🚀 InviteFlow — Production Deployment Guide

This guide takes InviteFlow from local dev to a live, internet-accessible product.

## 1. Target architecture

```
        ┌──────────────────────────┐         ┌──────────────────────────┐
 users ─▶  Vercel  (Frontend)      │  HTTPS  │  Render  (Backend API)   │
        │  Next.js 14 app          ├────────▶│  Express + in-process     │
        │  https://app.yoursite    │  REST   │  scheduler (Redis-free)   │
        └──────────────────────────┘         └───────────┬──────────────┘
                                                          │ TDS (1433, TLS)
                                                          ▼
                                            ┌──────────────────────────┐
                                            │  Azure SQL Database       │
                                            │  (managed SQL Server)     │
                                            └──────────────────────────┘
                          external (optional): OpenAI API · WhatsApp Cloud API
```

| Part | Platform | Why |
| ---- | -------- | --- |
| **Frontend** (`frontend/`) | **Vercel** | First-class Next.js hosting, zero-config, global CDN |
| **Backend** (`backend/`) | **Render** (or Railway) | Long-running Node process — needed for the in-process scheduler |
| **Database** | **Azure SQL Database** | Managed SQL Server; works with Prisma's `sqlserver` provider |
| **Jobs** | in-process on the API | Redis-free scheduler runs inside the Render web service |

> **Why not the scheduler on Vercel?** Vercel functions are serverless (no long-lived
> process), so scheduled messages/reminders must run on the always-on Render service.

---

## 2. Prerequisites

- Code pushed to a **GitHub** repo (Vercel + Render deploy from Git).
- Accounts: [Vercel](https://vercel.com), [Render](https://render.com), [Azure](https://portal.azure.com).
- Node 20+ locally (for the one-time DB schema push).

Generate two strong JWT secrets locally (needed if you don't use the Render blueprint):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 3. Step 1 — Provision the database (Azure SQL)

1. Azure Portal → **Create a resource → SQL Database**.
2. Create a new **SQL Server** (logical server): note the **server name**
   (`yourserver.database.windows.net`), **admin login**, and **password**.
3. Database name: `inviteflow`. Tier: **Basic** or **Serverless (General Purpose)** is plenty to start.
4. **Networking → Firewall:** add a rule allowing your backend's outbound IP.
   - For Render, enable **"Allow Azure services and resources"** is *not* enough (Render isn't Azure) —
     add Render's static outbound IPs (Render dashboard → service → *Connect* shows them), or for an
     initial test add your own IP + a temporary `0.0.0.0` rule (⚠️ remove it before going live).
5. Your Prisma connection string (note `encrypt=true;trustServerCertificate=false` for Azure):
   ```
   sqlserver://yourserver.database.windows.net:1433;database=inviteflow;user=youradmin;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=false
   ```

---

## 4. Step 2 — Create the schema + seed (one time)

From your machine, point Prisma at the **cloud** DB and push the schema:

```bash
cd backend
# PowerShell:
$env:DATABASE_URL="sqlserver://yourserver.database.windows.net:1433;database=inviteflow;user=youradmin;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=false"
npx prisma db push      # creates all tables
npm run seed            # plans + admin user (admin@inviteflow.app / admin12345)
```

> **Production-grade alternative:** instead of `db push`, create a migration once
> (`npx prisma migrate dev --name init`), commit the `prisma/migrations/` folder, and let
> the backend run `npx prisma migrate deploy` on each deploy (add it as a Render *Pre-Deploy Command*).
>
> ⚠️ **Change the seeded admin password** immediately after first login (or seed a custom admin).

---

## 5. Step 3 — Deploy the backend (Render)

**Option A — Blueprint (recommended):** the repo includes [`render.yaml`](../render.yaml).
In Render: **New + → Blueprint → pick this repo**. It creates the `inviteflow-api` web service and
auto-generates the JWT secrets. Then fill the `sync:false` vars (below).

**Option B — Manual web service:**
- New + → **Web Service** → connect the repo.
- **Root Directory:** `backend`
- **Build Command:** `npm ci && npm run build`  *(build runs `prisma generate` + `tsc`)*
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health`

**Environment variables** (Render dashboard):

| Key | Value |
| --- | ----- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | your Azure SQL connection string |
| `JWT_ACCESS_SECRET` | a 48-byte random string (blueprint auto-generates) |
| `JWT_REFRESH_SECRET` | a *different* 48-byte random string |
| `APP_URL` | your Vercel URL (set after Step 4), e.g. `https://inviteflow.vercel.app` |
| `CORS_ORIGINS` | same Vercel URL (comma-separate multiples) |
| `SCHEDULER` | `inline` |
| `OPENAI_API_KEY` | optional (empty → mock AI) |
| `WHATSAPP_PROVIDER` | `mock` (or `cloud` + the WhatsApp vars) |

> The backend **refuses to boot in production with weak/default JWT secrets** (see `env.ts`),
> so make sure these are strong. `PORT` is injected by Render automatically.

After deploy, verify: `https://inviteflow-api.onrender.com/api/health` → `{"status":"ok"}`.

---

## 6. Step 4 — Deploy the frontend (Vercel)

1. Vercel → **Add New → Project → import the repo**.
2. **Root Directory:** `frontend` (important — the app is in a subfolder).
3. Framework preset: **Next.js** (auto-detected). Build/Output: defaults.
4. **Environment Variable:**
   | Key | Value |
   | --- | ----- |
   | `NEXT_PUBLIC_API_URL` | `https://inviteflow-api.onrender.com/api` |
5. Deploy. Note your URL, e.g. `https://inviteflow.vercel.app`.

---

## 7. Step 5 — Wire them together

Back in **Render**, set/confirm and redeploy:
- `APP_URL` = `https://inviteflow.vercel.app`  *(used in RSVP/invitation links)*
- `CORS_ORIGINS` = `https://inviteflow.vercel.app`  *(so the browser can call the API)*

> Add Vercel **preview** domains to `CORS_ORIGINS` too if you want PR previews to reach the API:
> `https://inviteflow.vercel.app,https://inviteflow-git-*.vercel.app` — note wildcards aren't matched
> by the exact allowlist, so list concrete preview URLs or a custom domain.

---

## 8. Step 6 — Post-deploy checklist

- [ ] `GET /api/health` returns ok; signup/login works end-to-end from the live frontend.
- [ ] Logged in as admin → `/admin` loads; **change the seeded admin password**.
- [ ] Create an event → add a guest → the RSVP link uses your **production** domain.
- [ ] Schedule a message a few minutes out → confirm the in-process scheduler delivers it.
- [ ] Remove any temporary `0.0.0.0` Azure SQL firewall rule.
- [ ] Rotate `JWT_*` secrets if they were ever committed/shared.

---

## 9. Scaling & production notes

- **Background jobs:** today the scheduler runs in-process on the single Render web instance —
  perfect for one instance. If you scale the web service to **2+ instances**, run jobs separately:
  deploy a Render **Background Worker** with start command `npm run worker:start`, and set
  `SCHEDULER=off` on the web service (the worker claims jobs atomically, so no double-send).
  To go further, swap the poller for **BullMQ + Redis** (e.g. Memurai/Upstash) — the job functions
  in `messaging.delivery.ts` / `reminders.scheduler.ts` stay unchanged.
- **Cold starts:** Render's free plan sleeps after inactivity. Use a paid instance (or a cron pinger)
  for an always-warm API + reliable scheduler.
- **Real WhatsApp:** set `WHATSAPP_PROVIDER=cloud` + `WHATSAPP_PHONE_NUMBER_ID` +
  `WHATSAPP_ACCESS_TOKEN`; point the Meta webhook to `POST /api/webhooks/whatsapp` and the verify
  handshake to `GET /api/webhooks/whatsapp` with `WHATSAPP_VERIFY_TOKEN`.
- **Custom domain:** add it in Vercel (frontend) and update `APP_URL` + `CORS_ORIGINS` on the backend.

---

## 10. Alternatives

- **Railway** instead of Render: create a service from the repo, root `backend`, same build/start
  commands and env vars. Railway also offers a managed Redis if you later adopt BullMQ.
- **Docker:** `backend/Dockerfile` is multi-stage and production-ready; deploy it to any container host
  (Render Docker, Fly.io, Azure Container Apps). Set the same env vars.
- **Database:** any reachable SQL Server works (Azure SQL, AWS RDS for SQL Server, a managed VM). Keep
  `encrypt=true`; use `trustServerCertificate=false` with a real certificate.
