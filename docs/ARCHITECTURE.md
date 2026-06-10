# 🏗️ System Architecture — InviteFlow

This document is the single source of truth for the platform design: high-level
architecture, the multi-tenant data model, the full REST API surface, background
jobs, and the key runtime data flows.

---

## 1. High-Level Architecture

```
                            ┌─────────────────────────────────────┐
                            │              CLIENTS                 │
                            │                                      │
   Wedding owner ──────────▶│  Next.js Web App (dashboard,         │
                            │  invitation builder, analytics)      │
                            │                                      │
   Guest (mobile) ─────────▶│  Public RSVP page  /rsvp/:token      │
                            └───────────────┬──────────────────────┘
                                            │  HTTPS (REST + JWT)
                                            ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                     EXPRESS API  (backend/)                     │
        │                                                                 │
        │  Middleware:  CORS → JSON → requestId → auth(JWT) → tenant →    │
        │               rateLimit → routes → errorHandler                 │
        │                                                                 │
        │  Modules:  auth · users · events · guests · invitations ·       │
        │            templates · rsvp · messaging · ai · analytics ·      │
        │            reminders · billing · admin · webhooks               │
        └───────┬───────────────────┬───────────────────┬────────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
      ┌──────────────────┐  ┌───────────────┐  ┌──────────────────────┐
      │   SQL Server     │  │     Redis     │  │  External Services   │
      │  (Prisma ORM)    │  │  BullMQ queue │  │                      │
      │                  │  │  + cache      │  │  • OpenAI (AI text)  │
      │  tenant data,    │  │               │  │  • WhatsApp Business │
      │  messages,       │  │  jobs:        │  │    Cloud API         │
      │  analytics       │  │  send-message │  │  • S3 / storage      │
      │                  │  │  reminders    │  │    (image uploads)   │
      └──────────────────┘  └──────┬────────┘  └──────────┬───────────┘
                                   │                       │
                                   ▼                       │
                         ┌──────────────────┐              │
                         │  WORKER process  │◀─────────────┘
                         │  (BullMQ jobs)   │  delivers WhatsApp messages,
                         │                  │  fires scheduled reminders,
                         │                  │  retries failures
                         └──────────────────┘
                                   ▲
                                   │  webhooks (delivery/read receipts,
   WhatsApp ─────────────────────┘   inbound RSVP button taps)
```

### Processes
| Process | Responsibility |
| ------- | -------------- |
| **API** (`npm run dev` / `start`) | Serves the REST API, enqueues jobs |
| **Worker** (`npm run worker`) | Consumes BullMQ jobs: WhatsApp send, reminders, retries |
| **SQL Server** | Durable storage, source of truth |
| **Redis** | Job queue (BullMQ) + short-lived cache / rate-limit buckets |

---

## 2. Multi-Tenancy Model

This is a **shared-database, shared-schema** multi-tenant design (the standard for
early-stage SaaS):

- Every tenant-owned row carries an `ownerId` (→ `users.id`), directly or through its
  parent (`Event.ownerId`).
- The `tenant` middleware reads `req.user.id` from the verified JWT and **all repository
  queries are filtered by owner**. There is no code path that returns another tenant's
  rows.
- `ADMIN` users bypass tenant scoping only through dedicated `/admin/*` routes that are
  explicitly guarded by `requireRole('ADMIN')`.
- Public RSVP access uses an **unguessable per-guest token** (`Guest.rsvpToken`,
  `cuid`) instead of JWT — the guest never logs in.

---

## 3. Database Schema (overview)

Full definition lives in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

> **SQL Server modeling notes** (the Prisma `sqlserver` connector has no native
> `enum` or `Json` types): enum fields are stored as bounded `String`s with their
> allowed values centralized in [`src/lib/enums.ts`](../backend/src/lib/enums.ts);
> JSON documents (`design`, `metadata`, `features`, webhook `payload`) are stored
> as `NVARCHAR(MAX)` text and (de)serialized in the service layer; every id/FK and
> indexed string column has a bounded length to respect the 1700-byte index-key
> limit; and the `Message→Guest` / `AnalyticsEvent→Guest` foreign keys use
> `NoAction` to avoid SQL Server's "multiple cascade paths" restriction (those
> cascades are performed explicitly in the guest-delete service).

Entity summary:

```
User ──1:N── Event ──1:N── Guest ──1:N── Message
 │            │      │                     ▲
 │            │      └──1:N── AnalyticsEvent│
 │            │                            │
 │            ├──1:1── Invitation          │
 │            ├──1:N── Reminder ───────────┘ (reminders enqueue messages)
 │            └──N:1── Template
 │
 ├──1:1── Subscription ──N:1── Plan
 └──(ADMIN role)──▶ system-wide read access

Template ──N:1── User (creator)   // null creator = system/global template
WebhookEvent                       // raw provider callbacks (audit + idempotency)
```

### Core entities
| Entity | Purpose | Key fields |
| ------ | ------- | ---------- |
| `User` | Account / tenant root | `email`, `passwordHash`, `role`, `name` |
| `Plan` | Subscription tier | `name`, `priceCents`, `maxEvents`, `maxGuests`, `features` |
| `Subscription` | User ↔ Plan link | `status`, `currentPeriodEnd` |
| `Event` | A wedding/event | `ownerId`, `title`, `type`, `eventDate`, `venue`, `location`, `status` |
| `Invitation` | Design + content for an event | `eventId`, `design (JSON)`, `bodyText`, `templateId`, `status` |
| `Template` | Reusable design | `name`, `category`, `design (JSON)`, `isPublic`, `creatorId` |
| `Guest` | Invitee | `eventId`, `name`, `phone`, `groupLabel`, `rsvpStatus`, `partySize`, `rsvpToken` |
| `Message` | Outbound WhatsApp msg | `guestId`, `type`, `status`, `scheduledAt`, `providerMsgId`, `retryCount` |
| `Reminder` | Scheduled reminder rule | `eventId`, `offsetHours`, `enabled` |
| `AnalyticsEvent` | Tracking event | `eventId`, `guestId?`, `type`, `metadata` |
| `WebhookEvent` | Raw provider callback | `provider`, `payload`, `processedAt` |

### Important enums
- `Role`: `USER`, `ADMIN`
- `EventType`: `WEDDING`, `ENGAGEMENT`, `BIRTHDAY`, `CORPORATE`, `OTHER`
- `EventStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `RsvpStatus`: `PENDING`, `GOING`, `NOT_GOING`, `MAYBE`
- `MessageType`: `INVITATION`, `REMINDER`, `CUSTOM`
- `MessageStatus`: `QUEUED`, `SCHEDULED`, `SENT`, `DELIVERED`, `READ`, `FAILED`
- `AnalyticsType`: `INVITATION_OPENED`, `RSVP_VIEWED`, `RSVP_CLICKED`, `MESSAGE_SENT`, `MESSAGE_DELIVERED`, `MESSAGE_READ`
- `SubscriptionStatus`: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`

---

## 4. REST API Surface

Base path: `/api`. All non-public routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/signup` | Create account, returns tokens |
| POST | `/login` | Authenticate, returns tokens |
| POST | `/refresh` | Exchange refresh token for new access token |
| POST | `/logout` | Revoke refresh token |
| GET  | `/me` | Current user profile |

### Events — `/api/events`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List my events |
| POST | `/` | Create event |
| GET | `/:id` | Get one event (with counts) |
| PATCH | `/:id` | Update event |
| DELETE | `/:id` | Delete event |

### Guests — `/api/events/:eventId/guests`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List guests (filter by group/status) |
| POST | `/` | Add guest |
| POST | `/import` | Bulk CSV import (multipart) |
| PATCH | `/:guestId` | Update guest |
| DELETE | `/:guestId` | Remove guest |

### Invitation & Templates — `/api/events/:eventId/invitation`, `/api/templates`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/events/:eventId/invitation` | Get invitation design |
| PUT | `/events/:eventId/invitation` | Save invitation design (drag-and-drop JSON) |
| GET | `/templates` | List templates (public + mine) |
| POST | `/templates` | Save design as template |
| GET | `/templates/:id` | Get template |

### RSVP (public) — `/api/rsvp`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/:token` | Fetch invitation + current RSVP (no auth) |
| POST | `/:token/respond` | Submit RSVP (`GOING`/`NOT_GOING`/`MAYBE`, partySize) |

### Messaging — `/api/events/:eventId/messages`
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/send` | Queue invitation to selected/all guests |
| POST | `/schedule` | Queue with `scheduledAt` |
| GET | `/` | List messages + statuses |
| POST | `/:messageId/retry` | Retry a failed message |

### AI — `/api/ai`
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/generate-text` | Generate invitation text (eventType, tone) |
| POST | `/improve-text` | Improve user-supplied text |
| POST | `/suggest-template` | Suggest a design template |

### Reminders — `/api/events/:eventId/reminders`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List reminder rules |
| PUT | `/` | Configure reminders (offsets, enabled) |

### Analytics — `/api/events/:eventId/analytics`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/summary` | Counts: sent, opened, responded, going/not-going |
| GET | `/timeline` | Time-series for charts |

### Webhooks (public, signature-verified) — `/api/webhooks`
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/whatsapp` | WhatsApp webhook verification handshake |
| POST | `/whatsapp` | Delivery/read receipts + inbound messages |

### Admin — `/api/admin` (role: ADMIN)
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/users` | List all users |
| PATCH | `/users/:id` | Update user (role, status) |
| GET | `/plans` / POST / PATCH | Manage subscription plans |
| GET | `/templates` | Manage global templates |
| GET | `/analytics` | System-wide metrics |
| GET | `/messages` | All messages across tenants |

---

## 5. Backend Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # data model
│   └── seed.ts                # seed plans, admin user, sample templates
├── src/
│   ├── server.ts              # process entry: bootstraps app + listens
│   ├── app.ts                 # builds Express app (middleware + routes)
│   ├── worker.ts              # BullMQ worker entry (Phase 4)
│   ├── config/
│   │   ├── env.ts             # validated environment config (Zod)
│   │   ├── prisma.ts          # singleton PrismaClient
│   │   └── redis.ts           # ioredis connection (Phase 4)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification → req.user
│   │   ├── tenant.ts          # tenant scoping guard
│   │   ├── requireRole.ts     # RBAC guard
│   │   ├── validate.ts        # Zod request validation
│   │   ├── rateLimit.ts       # express-rate-limit config
│   │   └── error.ts           # central error handler + 404
│   ├── routes/
│   │   └── index.ts           # mounts all module routers under /api
│   ├── modules/               # feature modules (router + controller + service)
│   │   ├── auth/
│   │   ├── events/
│   │   ├── guests/
│   │   ├── invitations/
│   │   ├── templates/
│   │   ├── rsvp/
│   │   ├── messaging/
│   │   ├── ai/
│   │   ├── reminders/
│   │   ├── analytics/
│   │   ├── webhooks/
│   │   └── admin/
│   ├── lib/                   # cross-cutting helpers
│   │   ├── ApiError.ts        # typed HTTP errors
│   │   ├── asyncHandler.ts    # async route wrapper
│   │   ├── jwt.ts             # sign/verify access & refresh tokens
│   │   ├── password.ts        # bcrypt hash/verify
│   │   └── logger.ts          # pino logger
│   └── types/
│       └── express.d.ts       # augments Express.Request with user/tenant
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

Each **module** follows the same shape:
```
modules/<name>/
├── <name>.routes.ts       # Express router, wires validation + controller
├── <name>.controller.ts   # request/response handling (thin)
├── <name>.service.ts      # business logic (testable, no req/res)
└── <name>.schema.ts       # Zod schemas for inputs
```

---

## 6. Key Data Flows

### A. Send invitation
```
Owner clicks "Send" ─▶ POST /events/:id/messages/send
  └─ service creates Message rows (status=QUEUED) per guest
     └─ enqueues "send-message" BullMQ jobs
        └─ Worker calls WhatsApp API with rsvp link (/rsvp/:token)
           ├─ success → Message.status=SENT, providerMsgId stored
           └─ failure → retry w/ backoff; after N tries → FAILED
WhatsApp later POSTs /webhooks/whatsapp
  └─ updates Message.status = DELIVERED / READ + AnalyticsEvent
```

### B. Guest RSVP
```
Guest opens /rsvp/:token (web)
  └─ GET /api/rsvp/:token → records AnalyticsEvent(INVITATION_OPENED)
     returns invitation design + current status
Guest taps "Going"
  └─ POST /api/rsvp/:token/respond
     └─ updates Guest.rsvpStatus + AnalyticsEvent(RSVP_CLICKED)
        └─ dashboard reflects change (polled / websockets later)
```

### C. Reminders
```
Reminder rule (offsetHours=24) on Event with eventDate
  └─ scheduler (BullMQ repeatable) computes fire time = eventDate - 24h
     └─ enqueues reminder messages to all GOING/PENDING guests
        └─ same send-message pipeline as (A)
```

---

## 7. Security

- Passwords hashed with **bcrypt** (cost ≥ 12).
- **Short-lived access JWT** (15m) + **refresh token** (7d, revocable, stored hashed).
- All inputs validated with **Zod** before reaching services.
- **Helmet**, CORS allowlist, and per-route **rate limiting**.
- RSVP tokens are high-entropy `cuid`s, not sequential ids.
- Webhook endpoints verify provider signatures; payloads logged for idempotency.
- Tenant isolation enforced centrally — never trust client-supplied `ownerId`.
