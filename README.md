# 💍 InviteFlow — Digital Wedding Invitation SaaS

A production-ready, multi-tenant SaaS platform for creating digital wedding/event
invitations, importing guest lists, sending invitations via WhatsApp, tracking RSVPs,
and generating invitation content with AI.

> **Status:** Phase 2 in progress — backend implementation of AI, analytics, admin,
> webhooks, and scheduled messaging is now wired into the codebase. See
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the
> [Roadmap](#-build-roadmap) below.

---

## ✨ Features

| Domain | Capability |
| ------ | ---------- |
| **Auth** | Email/password signup & login, JWT access + refresh tokens, role-based access (USER / ADMIN) |
| **Multi-tenant** | Every record is scoped to its owning user; strict tenant isolation middleware |
| **Events** | Create weddings/events with date, venue, location |
| **Guests** | Add guests, bulk CSV import, group by event |
| **RSVP** | Per-guest secure invitation link, "Going / Not going / Maybe", live dashboard |
| **AI** | Generate & improve invitation text, suggest design templates (OpenAI, with mock fallback) |
| **Builder** | Drag-and-drop invitation editor, save designs as reusable templates |
| **WhatsApp** | Send invitations & reminders (WhatsApp Business API, with mock fallback), scheduled send, retries |
| **Analytics** | Track opens, RSVP clicks, response rates; dashboard charts |
| **Reminders** | Auto reminders (e.g. 24h / 3h before the event), configurable per event |
| **Admin** | Manage users, plans, templates, view system-wide analytics & message logs |

---

## 🧱 Tech Stack

**Backend** — Node.js · Express · TypeScript · Microsoft SQL Server · Prisma ORM · JWT · Zod · BullMQ (jobs)
**Frontend** — Next.js 14 · TailwindCSS · TanStack Query · dnd-kit *(Phase 3)*
**Infra** — Docker · docker-compose · Redis (queues/cache)

---

## 📁 Repository Layout

```
digital wedding invitations/
├── README.md                  ← you are here
├── docker-compose.yml         ← (optional) SQL Server + Redis + backend
├── docs/
│   └── ARCHITECTURE.md        ← system design, schema, API map, data flows
├── backend/                   ← Express + Prisma API (Phases 1–2, 4, 5)
│   ├── prisma/schema.prisma   ← full multi-tenant database schema
│   └── src/                   ← modular source (see ARCHITECTURE.md)
└── frontend/                  ← Next.js app (Phase 3) — created later
```

---

## 🚀 Getting Started (local dev — Microsoft SQL Server)

### Prerequisites
- **Node.js 20+** and **npm** — install from <https://nodejs.org> (LTS) or
  `winget install OpenJS.NodeJS.LTS`.
- **Microsoft SQL Server** — any of: SQL Server **Express** (free),
  **Developer** edition, or **LocalDB**.
  `winget install Microsoft.SQLServer.2022.Express`
  Recommended GUI: **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.

### 1. Create the database
In SSMS / Azure Data Studio (or `sqlcmd`), run once:
```sql
CREATE DATABASE inviteflow;
```
> If you use SQL authentication, make sure the `sa` (or a dedicated) login is
> enabled and **TCP/IP** is on (SQL Server Configuration Manager → Protocols).

### 2. Configure & run the backend
```powershell
cd backend
copy .env.example .env        # then set DATABASE_URL (see the file's comments) + JWT secrets
npm install
npm run prisma:generate
npm run prisma:migrate        # creates all tables from schema.prisma
npm run seed                  # optional: plans + admin user + sample templates
npm run dev                   # starts API on http://localhost:4000
```

Health check: <http://localhost:4000/api/health>

> **Connection string** lives in `backend/.env`. Pick the variant matching your
> setup (SQL auth, Windows auth, LocalDB, or named instance) — examples are in
> `backend/.env.example`.

---

## 🗺️ Build Roadmap

- [x] **Phase 1** — System architecture, database schema, backend structure
- [x] **Phase 2** — Backend implementation (API modules for auth, events, guests, invitations, messaging, AI, analytics, admin, webhooks)
- [x] **Phase 3** — Frontend UI (Next.js + Tailwind + dnd-kit invitation builder)
- [x] **Phase 4** — AI integration + WhatsApp (mock + Cloud provider) + Redis-free background scheduler
- [x] **Phase 5** — Admin dashboard + per-event analytics (Recharts)
- [x] **Phase 6** — Production hardening + deployment guide → see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📄 License

Proprietary — startup product. All rights reserved.
