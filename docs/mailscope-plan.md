# Mailscope — Email Deliverability Audit & Monitoring Platform
### Comprehensive System Design, Architecture & Implementation Plan

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Design](#2-system-design)
3. [System Architecture](#3-system-architecture)
4. [Data Models](#4-data-models)
5. [API Specification](#5-api-specification)
6. [Folder Structure](#6-folder-structure)
7. [Sprint Plan](#7-sprint-plan)
8. [GitHub README Template](#8-github-readme-template)

---

## 1. Product Overview

### What is Mailscope?

Mailscope is a full-stack email deliverability audit and monitoring tool. It gives senders visibility into why their emails land in spam by continuously checking domain health, running seed inbox placement tests, and tracking reputation over time.

Unlike warmup tools that require a pool of users to work, Mailscope is useful from day one for a single user — it audits what already exists (DNS records, blacklist status) and gives actionable fixes.

### Target Users

- Indie developers and startup founders sending transactional or outreach emails
- Small marketing teams managing a sending domain
- Email service providers wanting a self-hosted monitoring layer

### Core Value Propositions

- **Instant domain audit** — SPF, DKIM, DMARC, and MX checked in seconds via DNS lookup
- **Blacklist detection** — checks against major RBLs (Spamhaus, Barracuda, SORBS) continuously
- **Seed testing** — send to Mailscope's seed addresses and see exactly which folder you land in across Gmail, Outlook, and Yahoo
- **Health score** — a single 0–100 score that aggregates all signals, tracked daily
- **Alerting** — email or Slack notification when reputation changes or a blacklist hit occurs

### Monetisation Path (if taken to product)

| Tier | Price | Limits |
|---|---|---|
| Free | $0 | 1 domain, weekly checks, no seed tests |
| Starter | $19/mo | 3 domains, daily checks, 10 seed tests/month |
| Pro | $49/mo | 10 domains, real-time alerts, unlimited seed tests, Slack integration |

---

## 2. System Design

### 2.1 Core Concepts

**Domain** — the unit of tracking. A user adds a domain (e.g. `mycompany.com`) and Mailscope continuously monitors it.

**DNS Check** — a lookup of SPF, DKIM, DMARC, and MX records for a domain. Run on add, then daily via background job.

**Blacklist Check** — DNS-based RBL (Real-time Blackhole List) lookups. Checks whether the domain or its sending IPs appear on major spam blacklists.

**Health Score** — a computed 0–100 score derived from DNS check outcomes and blacklist status. Stored as a daily snapshot to power trend charts.

**Seed Test** — a user-triggered test where Mailscope provides a list of seed email addresses to BCC. The backend polls those inboxes via IMAP and records whether the email landed in inbox, spam, or promotions tab per provider.

**Alert Rule** — a user-configured rule that triggers a notification (email or Slack) when a specific condition is met (blacklist hit, health score drop, DKIM fail, etc.).

---

### 2.2 Scoring Algorithm

The health score is a weighted sum of signal outcomes. Each signal contributes a maximum number of points; partial credit is awarded for `warn` states.

| Signal | Pass | Warn | Fail |
|---|---|---|---|
| SPF record present and valid | 25 pts | 12 pts | 0 pts |
| DKIM record present and valid | 25 pts | 12 pts | 0 pts |
| DMARC policy (enforce = full, none = warn) | 20 pts | 10 pts | 0 pts |
| No blacklist hits | 20 pts | — | 0 pts |
| MX records configured | 10 pts | 5 pts | 0 pts |

**Total maximum: 100 points**

Score ranges:
- **80–100** — Healthy. Strong reputation signals.
- **60–79** — Moderate. One or more issues need attention.
- **40–59** — At risk. Likely deliverability problems.
- **0–39** — Critical. Blacklisted or severely misconfigured.

---

### 2.3 Seed Test Flow

```
User triggers test via UI
    ↓
Backend creates SeedTest record (status: awaiting_email)
    ↓
Backend returns list of seed addresses to BCC
    ↓
User sends their actual email, BCCing those addresses
    ↓
Worker polls seed inboxes every 2 minutes (max 1 hour)
    ↓
When email found → record placement (inbox / spam / promotions)
    ↓
Mark test complete, update SeedTestResult records
    ↓
Frontend polls /seed-tests/{test_id}/result until complete
```

Seed accounts needed (one-time setup, gitignored):
- One Gmail account
- One Outlook account
- One Yahoo account

---

### 2.4 Background Job Design

Two types of background work:

**Scheduled (cron)** — runs daily for every active domain:
- DNS check → store result → recompute health score → store snapshot
- Blacklist check → store result → trigger alert if newly listed

**On-demand (queue)** — triggered by user actions:
- Immediate DNS recheck (user presses "run now")
- Immediate blacklist recheck
- Seed inbox polling loop (runs until email found or timeout)

Technology: `arq` (async Redis queue) for both. APScheduler enqueues daily jobs at 06:00 UTC.

---

### 2.5 Alerting Design

Alert rules are stored per domain. On each worker run, the alerting service evaluates all rules for that domain and fires if the condition is newly met (i.e. was not already triggered in the previous check — prevents repeat spam).

Supported triggers:
- `blacklist_hit` — domain appeared on any RBL
- `health_score_drop` — score fell by more than 10 points since last check
- `dkim_fail` — DKIM status changed to fail
- `spf_fail` — SPF status changed to fail
- `dmarc_none` — DMARC policy is `none` (warn state)

Channels:
- `email` — via SMTP using app credentials (Mailgun/SendGrid in prod)
- `slack` — via incoming webhook URL stored per alert rule

---

## 3. System Architecture

### 3.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│   React + TypeScript + Tailwind (Vite)                          │
│   Deployed: Vercel                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼────────────────────────────────────┐
│                        API Layer                                │
│   FastAPI (Python 3.11)                                         │
│   JWT auth, domain CRUD, metrics, seed tests, alerts            │
│   Deployed: Railway                                             │
└──────────┬────────────────────────────────┬─────────────────────┘
           │ SQLAlchemy ORM                 │ arq (enqueue)
┌──────────▼────────────┐       ┌───────────▼─────────────────────┐
│      PostgreSQL        │       │         Redis                   │
│   Users, domains,      │       │   Job queue + caching           │
│   checks, metrics,     │◄──────│                                 │
│   seed tests, alerts   │       └───────────┬─────────────────────┘
└───────────────────────┘                   │ arq (consume)
                              ┌─────────────▼─────────────────────┐
                              │        Worker Service              │
                              │   Async Python process             │
                              │   DNS checks, blacklist checks,    │
                              │   IMAP polling, alert evaluation   │
                              │   Deployed: Railway (separate svc) │
                              └──────────┬────────────────────────┘
                                         │
              ┌──────────────────────────┼───────────────────────┐
              │                          │                        │
    ┌─────────▼────────┐    ┌────────────▼──────────┐  ┌─────────▼────────┐
    │   DNS Resolver   │    │  Blacklist RBL lookup  │  │  IMAP Poller     │
    │   dnspython      │    │  Spamhaus / Barracuda  │  │  Seed inboxes    │
    │   SPF/DKIM/DMARC │    │  SORBS / SpamCop       │  │  Gmail / Outlook │
    └──────────────────┘    └───────────────────────┘  └──────────────────┘
```

---

### 3.2 Infrastructure

| Component | Local (Docker) | Production |
|---|---|---|
| API | `uvicorn` container | Railway service |
| Worker | `arq` container | Railway service (separate) |
| PostgreSQL | Docker container | Railway Postgres plugin |
| Redis | Docker container | Railway Redis plugin |
| Frontend | `vite dev` | Vercel |
| Emails | Mailpit (local SMTP) | Mailgun / SendGrid |

### 3.3 Docker Compose Services

```yaml
services:
  db:        # PostgreSQL 16
  redis:     # Redis 7
  api:       # FastAPI (uvicorn, port 8000)
  worker:    # arq worker process
  mailpit:   # local SMTP + web UI for email testing
```

---

## 4. Data Models

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| hashed_password | VARCHAR | bcrypt |
| name | VARCHAR | |
| created_at | TIMESTAMPTZ | |
| is_active | BOOLEAN | default true |

### domains
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| domain | VARCHAR | e.g. mycompany.com |
| status | VARCHAR | active / paused |
| health_score | INTEGER | 0–100, updated by worker |
| added_at | TIMESTAMPTZ | |
| last_checked_at | TIMESTAMPTZ | |

### dns_records
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| domain_id | UUID FK → domains | |
| checked_at | TIMESTAMPTZ | |
| spf_status | VARCHAR | pass / warn / fail |
| spf_record | TEXT | raw record value |
| dkim_status | VARCHAR | |
| dkim_record | TEXT | |
| dmarc_status | VARCHAR | |
| dmarc_record | TEXT | |
| mx_status | VARCHAR | |
| mx_records | JSONB | list of MX hostnames |

### blacklist_results
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| domain_id | UUID FK → domains | |
| checked_at | TIMESTAMPTZ | |
| is_clean | BOOLEAN | |
| hits | JSONB | list of { list, listed, detail } |

### metric_snapshots
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| domain_id | UUID FK → domains | |
| date | DATE | one row per domain per day |
| health_score | INTEGER | |
| spf_status | VARCHAR | |
| dkim_status | VARCHAR | |
| dmarc_status | VARCHAR | |
| blacklisted | BOOLEAN | |

### seed_tests
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| domain_id | UUID FK → domains | |
| subject_hint | VARCHAR | what user said they sent |
| status | VARCHAR | awaiting_email / processing / complete / expired |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | created_at + 1 hour |

### seed_test_results
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| seed_test_id | UUID FK → seed_tests | |
| provider | VARCHAR | gmail / outlook / yahoo |
| placement | VARCHAR | inbox / spam / promotions / not_found |
| checked_at | TIMESTAMPTZ | |

### alert_rules
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| domain_id | UUID FK → domains | |
| trigger | VARCHAR | blacklist_hit / health_score_drop / dkim_fail / spf_fail |
| channel | VARCHAR | email / slack |
| slack_webhook_url | VARCHAR | nullable |
| last_fired_at | TIMESTAMPTZ | for dedup logic |
| created_at | TIMESTAMPTZ | |

---

## 5. API Specification

**Base URL:** `/api/v1`  
**Auth:** Bearer token (JWT) in `Authorization` header for all protected routes.

---

### 5.1 Auth

#### `POST /auth/register`
Create a new user account.

Request:
```json
{ "name": "Antony", "email": "user@example.com", "password": "secret123" }
```
Response `201`:
```json
{ "id": "uuid", "email": "user@example.com", "name": "Antony" }
```

---

#### `POST /auth/login`
Request:
```json
{ "email": "user@example.com", "password": "secret123" }
```
Response `200`:
```json
{ "access_token": "jwt...", "refresh_token": "jwt...", "token_type": "bearer" }
```

---

#### `POST /auth/refresh`
Request:
```json
{ "refresh_token": "jwt..." }
```
Response `200`:
```json
{ "access_token": "new_jwt...", "token_type": "bearer" }
```

---

#### `GET /users/me` *(protected)*
Response `200`:
```json
{ "id": "uuid", "email": "user@example.com", "name": "Antony", "created_at": "..." }
```

---

### 5.2 Domains

#### `GET /domains` *(protected)*
Response `200`:
```json
[
  {
    "id": "uuid",
    "domain": "mycompany.com",
    "health_score": 84,
    "status": "active",
    "last_checked_at": "2026-04-13T08:00:00Z",
    "added_at": "2026-01-01T00:00:00Z"
  }
]
```

#### `POST /domains` *(protected)*
Request:
```json
{ "domain": "mycompany.com" }
```
Response `201`:
```json
{ "id": "uuid", "domain": "mycompany.com", "status": "active", "health_score": null }
```
Immediately enqueues a DNS + blacklist check.

#### `DELETE /domains/{domain_id}` *(protected)*
Response `204`

---

### 5.3 DNS Checks

#### `GET /dns/{domain_id}/latest` *(protected)*
Response `200`:
```json
{
  "checked_at": "2026-04-13T08:00:00Z",
  "spf":   { "status": "pass", "record": "v=spf1 include:sendgrid.net ~all" },
  "dkim":  { "status": "fail", "record": null, "note": "No selector found at default._domainkey" },
  "dmarc": { "status": "warn", "record": "v=DMARC1; p=none", "note": "Policy is none — no enforcement" },
  "mx":    { "status": "pass", "records": ["mail.mycompany.com"] }
}
```

#### `POST /dns/{domain_id}/run` *(protected)*
Trigger an immediate recheck. Returns `202` and enqueues the job.

#### `GET /dns/{domain_id}/history` *(protected)*
Query params: `from` (date), `to` (date)

Response `200`:
```json
[
  { "date": "2026-04-01", "spf_status": "pass", "dkim_status": "fail", "dmarc_status": "warn" }
]
```

---

### 5.4 Blacklist Checks

#### `GET /blacklists/{domain_id}/latest` *(protected)*
Response `200`:
```json
{
  "checked_at": "2026-04-13T08:00:00Z",
  "is_clean": false,
  "hits": [
    { "list": "Spamhaus ZEN", "listed": true,  "detail": "127.0.0.2" },
    { "list": "Barracuda",    "listed": false,  "detail": null },
    { "list": "SORBS",        "listed": false,  "detail": null }
  ]
}
```

#### `POST /blacklists/{domain_id}/run` *(protected)*
Trigger immediate recheck. Returns `202`.

---

### 5.5 Seed Tests

#### `POST /seed-tests/{domain_id}/run` *(protected)*
Request:
```json
{ "subject_hint": "Q4 outreach campaign" }
```
Response `201`:
```json
{
  "test_id": "uuid",
  "seed_addresses": [
    "mailscope-seed-gmail@gmail.com",
    "mailscope-seed-outlook@outlook.com",
    "mailscope-seed-yahoo@yahoo.com"
  ],
  "status": "awaiting_email",
  "expires_at": "2026-04-13T09:00:00Z"
}
```

#### `GET /seed-tests/{domain_id}` *(protected)*
List all tests for a domain (paginated).

#### `GET /seed-tests/{test_id}/result` *(protected)*
Response `200`:
```json
{
  "test_id": "uuid",
  "status": "complete",
  "results": [
    { "provider": "gmail",   "placement": "inbox" },
    { "provider": "outlook", "placement": "spam" },
    { "provider": "yahoo",   "placement": "inbox" }
  ],
  "completed_at": "2026-04-13T08:45:00Z"
}
```
Frontend polls this every 10 seconds until `status` is `complete` or `expired`.

---

### 5.6 Metrics

#### `GET /metrics/{domain_id}/summary` *(protected)*
Response `200`:
```json
{
  "domain": "mycompany.com",
  "health_score": 84,
  "spf_status": "pass",
  "dkim_status": "fail",
  "dmarc_status": "warn",
  "blacklisted": false,
  "last_seed_test": {
    "inbox": 2, "spam": 1, "promotions": 0
  },
  "last_checked_at": "2026-04-13T08:00:00Z"
}
```

#### `GET /metrics/{domain_id}/score-history` *(protected)*
Query params: `from` (date), `to` (date)

Response `200`:
```json
[
  { "date": "2026-04-01", "health_score": 78 },
  { "date": "2026-04-02", "health_score": 81 },
  { "date": "2026-04-03", "health_score": 84 }
]
```

---

### 5.7 Alerts

#### `GET /alerts/{domain_id}` *(protected)*
Response `200`:
```json
[
  {
    "id": "uuid",
    "trigger": "blacklist_hit",
    "channel": "email",
    "created_at": "2026-04-01T00:00:00Z",
    "last_fired_at": null
  }
]
```

#### `POST /alerts/{domain_id}` *(protected)*
Request:
```json
{
  "trigger": "blacklist_hit",
  "channel": "slack",
  "slack_webhook_url": "https://hooks.slack.com/services/..."
}
```
Response `201`: alert rule object.

Supported triggers: `blacklist_hit` | `health_score_drop` | `dkim_fail` | `spf_fail` | `dmarc_none`  
Supported channels: `email` | `slack`

#### `DELETE /alerts/{alert_id}` *(protected)*
Response `204`

---

## 6. Folder Structure

### 6.1 Backend

```
mailscope-backend/
├── app/
│   ├── main.py                    # FastAPI entrypoint, lifespan, CORS
│   ├── config.py                  # Settings via pydantic-settings
│   ├── deps.py                    # get_db, get_current_user
│   │
│   ├── core/
│   │   ├── security.py            # JWT issue/verify, bcrypt hashing
│   │   └── scoring.py             # Health score computation logic
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── domain.py
│   │   ├── dns_record.py
│   │   ├── blacklist_result.py
│   │   ├── seed_test.py
│   │   ├── seed_test_result.py
│   │   ├── alert_rule.py
│   │   └── metric_snapshot.py
│   │
│   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── domain.py
│   │   ├── dns.py
│   │   ├── blacklist.py
│   │   ├── seed_test.py
│   │   ├── metrics.py
│   │   └── alert.py
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── domains.py
│   │       ├── dns.py
│   │       ├── blacklists.py
│   │       ├── seed_tests.py
│   │       ├── metrics.py
│   │       ├── alerts.py
│   │       └── router.py          # include_router for all above
│   │
│   ├── services/                  # Business logic, no FastAPI deps
│   │   ├── dns_checker.py         # dnspython: SPF, DKIM, DMARC, MX
│   │   ├── blacklist_checker.py   # RBL DNS lookups
│   │   ├── seed_monitor.py        # IMAP polling logic
│   │   ├── scorer.py              # Score computation
│   │   └── alerting.py            # Rule eval + email/Slack dispatch
│   │
│   ├── workers/
│   │   ├── queue.py               # arq Redis pool settings
│   │   ├── tasks.py               # Async task functions (called by arq)
│   │   └── scheduler.py           # APScheduler daily cron
│   │
│   ├── db/
│   │   ├── session.py             # engine, SessionLocal, get_db
│   │   └── base.py                # Base = declarative_base()
│   │
│   └── utils/
│       ├── logging.py
│       └── email_sender.py        # SMTP wrapper for alert emails
│
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_domains.py
│   ├── test_dns_checker.py
│   ├── test_scoring.py
│   └── test_seed_monitor.py
│
├── seed_accounts.json             # Seed inbox credentials — GITIGNORED
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 6.2 Frontend

```
mailscope-frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── router/
│   │   └── index.tsx              # React Router v6 config
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx  # All domains, aggregate stats
│   │   ├── domains/
│   │   │   ├── DomainsListPage.tsx
│   │   │   ├── AddDomainPage.tsx
│   │   │   └── DomainDetailPage.tsx
│   │   ├── seed-tests/
│   │   │   └── SeedTestPage.tsx
│   │   ├── alerts/
│   │   │   └── AlertsPage.tsx
│   │   └── settings/
│   │       └── ProfilePage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx          # pass (green) / warn (amber) / fail (red)
│   │   │   ├── Card.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ScoreRing.tsx      # SVG circular gauge 0–100
│   │   ├── dns/
│   │   │   ├── DnsCheckRow.tsx    # One row per record type
│   │   │   └── RecordDetails.tsx  # Expandable raw record value
│   │   ├── seed/
│   │   │   ├── SeedResultGrid.tsx # Provider × placement matrix
│   │   │   └── ProviderBadge.tsx  # Gmail / Outlook / Yahoo icon + label
│   │   └── charts/
│   │       ├── ScoreHistoryChart.tsx
│   │       └── PlacementBarChart.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDomain.ts
│   │   └── useSeedTest.ts         # Includes polling logic
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── services/
│   │   ├── apiClient.ts           # Axios instance, token interceptor
│   │   ├── authService.ts
│   │   ├── domainService.ts
│   │   ├── dnsService.ts
│   │   ├── blacklistService.ts
│   │   ├── seedTestService.ts
│   │   ├── metricsService.ts
│   │   └── alertService.ts
│   │
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   │
│   └── styles/
│       └── index.css              # Tailwind imports
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Sprint Plan

> **Pace:** 3 sprints × 2 weeks = 6 weeks total  
> **Stack:** Python 3.11 + FastAPI + PostgreSQL + Redis (arq) + React 18 + TypeScript + Tailwind  
> **Branching:** `main` (stable), `dev` (active), feature branches per task  
> **Testing:** pytest for backend, Vitest + React Testing Library for frontend

---

### Sprint 1 — Foundation & DNS Core (Weeks 1–2)

**Goal:** Working auth system, domain management, and synchronous DNS checking. A user can register, add a domain, and see DNS results.

---

#### Backend Tasks

**S1-B1 — Repo & Docker setup**
- Initialise `mailscope-backend/` with FastAPI, SQLAlchemy, Alembic, pydantic-settings, arq, dnspython, bcrypt, python-jose
- Write `docker-compose.yml` with services: `db` (Postgres 16), `redis` (Redis 7), `api` (uvicorn), `mailpit`
- Write `.env.example` with all required keys
- Confirm `docker compose up` brings all services up cleanly

**S1-B2 — Database models & migrations**
- Define SQLAlchemy models: `User`, `Domain`, `DnsRecord`, `BlacklistResult`, `MetricSnapshot`, `SeedTest`, `SeedTestResult`, `AlertRule`
- Run `alembic init` and configure `env.py` to use app models
- Generate and apply initial migration
- Verify schema in Postgres via `psql`

**S1-B3 — Auth system**
- Implement `core/security.py`: password hashing with bcrypt, JWT issue/verify with `python-jose`
- Implement `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- Implement `GET /users/me` with `get_current_user` dependency
- Write `tests/test_auth.py` covering register, login, token refresh, invalid credentials

**S1-B4 — Domain CRUD**
- Implement `GET /domains`, `POST /domains`, `DELETE /domains/{id}`
- Validate domain format (regex, no protocol prefix)
- Write `tests/test_domains.py`

**S1-B5 — DNS checker service**
- Implement `services/dns_checker.py` using `dnspython`
- SPF: query `TXT` records, detect `v=spf1`, classify `~all` as warn, `-all` as pass, missing as fail
- DKIM: query `default._domainkey.{domain}` TXT, handle not found
- DMARC: query `_dmarc.{domain}` TXT, classify `p=reject` as pass, `p=quarantine` as warn, `p=none` as warn, missing as fail
- MX: query `MX` records, missing = fail
- Returns structured `DnsCheckResult` dataclass

**S1-B6 — DNS endpoints**
- Wire `GET /dns/{domain_id}/latest` to run checker and store result
- Implement `POST /dns/{domain_id}/run` (synchronous for now, async in sprint 2)
- Implement `GET /dns/{domain_id}/history`
- Write `tests/test_dns_checker.py` with mocked DNS responses

---

#### Frontend Tasks

**S1-F1 — React scaffold**
- Initialise with `npm create vite@latest` (React + TypeScript)
- Install and configure Tailwind CSS v3
- Install React Router v6, Axios, Recharts
- Create base layout: `Sidebar`, `Navbar`, `PageContainer`
- Configure `apiClient.ts` with base URL from env, JWT interceptor

**S1-F2 — Auth pages**
- Implement `LoginPage.tsx` and `RegisterPage.tsx`
- Implement `AuthContext.tsx`: store tokens in memory (access) and localStorage (refresh)
- Implement protected route wrapper — redirect to login if unauthenticated
- Wire to `authService.ts`

**S1-F3 — Domains list page**
- Implement `DomainsListPage.tsx` showing domains with health score placeholder
- Implement `AddDomainPage.tsx` with domain input form and validation
- Navigate to domain detail on click

**S1-F4 — Domain detail page (DNS section)**
- Implement `DomainDetailPage.tsx` skeleton
- Implement `DnsCheckRow.tsx` with pass/warn/fail `Badge` component
- Call `GET /dns/{domain_id}/latest` and render results
- "Run check now" button calls `POST /dns/{domain_id}/run`

---

#### Sprint 1 Exit Criteria


- [ ] `docker compose up` starts all services with no errors
- [ ] `POST /auth/register` and `POST /auth/login` return valid JWTs
- [ ] Authenticated user can add a domain and see it listed
- [ ] `GET /dns/{domain_id}/latest` returns correctly classified SPF/DKIM/DMARC/MX results
- [ ] All auth and DNS checker tests pass (`pytest -v`)
- [ ] Login → add domain → view DNS results flow works end-to-end in the browser
- [ ] No hardcoded secrets in source; all config via `.env`

---

### Sprint 2 — Intelligence Layer: Scoring, Blacklists & Seed Testing (Weeks 3–4)

**Goal:** Fully async background jobs, blacklist detection, scoring algorithm, and the complete seed test flow. The product is functionally complete at the end of this sprint.

---

#### Backend Tasks

**S2-B1 — arq worker setup**
- Implement `workers/queue.py` with arq `RedisSettings`
- Implement `workers/tasks.py`: async functions `run_dns_check`, `run_blacklist_check`, `run_seed_poll`
- Add `worker` service to `docker-compose.yml` running `arq app.workers.tasks.WorkerSettings`
- Update `POST /dns/{domain_id}/run` and `POST /blacklists/{domain_id}/run` to enqueue instead of running inline

**S2-B2 — APScheduler daily cron**
- Implement `workers/scheduler.py` using APScheduler
- At 06:00 UTC daily: query all active domains, enqueue `run_dns_check` + `run_blacklist_check` for each
- Start scheduler in FastAPI lifespan (`app/main.py`)

**S2-B3 — Blacklist checker service**
- Implement `services/blacklist_checker.py`
- For each RBL (Spamhaus ZEN, Barracuda, SORBS, SpamCop): reverse the domain's IP and query `{reversed_ip}.{rbl_zone}`
- Also check domain-based URIBL lists where applicable
- Store result in `BlacklistResult`, update `Domain.health_score`
- Implement `GET /blacklists/{domain_id}/latest` and `POST /blacklists/{domain_id}/run`
- Write `tests/test_blacklist_checker.py` with mocked DNS

**S2-B4 — Scoring engine**
- Implement `core/scoring.py` with `compute_score(dns_result, blacklist_result) -> int`
- Apply weighting table (SPF 25, DKIM 25, DMARC 20, blacklists 20, MX 10)
- After every DNS or blacklist check, recompute score, update `Domain.health_score`, insert `MetricSnapshot`
- Write `tests/test_scoring.py` with boundary cases

**S2-B5 — Seed test backend**
- Set up `seed_accounts.json` (gitignored) with IMAP credentials for Gmail, Outlook, Yahoo seed accounts
- Implement `services/seed_monitor.py`:
  - Connect to each seed inbox via IMAP
  - Search for email with matching subject received after test creation
  - Detect folder: `INBOX` = inbox, `[Gmail]/Spam` or `Junk` = spam, `[Gmail]/Promotions` = promotions
  - Return `{ provider, placement }` per account
- Implement `workers/tasks.py:run_seed_poll`: poll every 2 min, mark complete or expired after 1 hour
- Implement `POST /seed-tests/{domain_id}/run`, `GET /seed-tests/{domain_id}`, `GET /seed-tests/{test_id}/result`
- Write `tests/test_seed_monitor.py` with mocked IMAP responses

**S2-B6 — Metrics endpoints**
- Implement `GET /metrics/{domain_id}/summary`
- Implement `GET /metrics/{domain_id}/score-history`
- Write `tests/test_metrics.py`

**S2-B7 — Alert system**
- Implement `services/alerting.py`: evaluate all rules after each check, compare to previous result, fire if newly triggered
- Email alerts via `utils/email_sender.py` (SMTP)
- Slack alerts via HTTP POST to webhook URL
- Implement `GET /alerts/{domain_id}`, `POST /alerts/{domain_id}`, `DELETE /alerts/{alert_id}`
- Write `tests/test_alerting.py`

---

#### Frontend Tasks

**S2-F1 — Score ring component**
- Implement `ScoreRing.tsx`: SVG circle gauge, colour changes by range (green / amber / red)
- Show score prominently on domain detail page and domain cards

**S2-F2 — Blacklist section**
- Add blacklist results section to `DomainDetailPage.tsx`
- Show per-RBL status (listed / clean) with colour-coded badges
- "Run check now" button for blacklist

**S2-F3 — Score history chart**
- Implement `ScoreHistoryChart.tsx` using Recharts `LineChart`
- Date range picker (last 7 days / 30 days / 90 days)
- Render on domain detail page

**S2-F4 — Seed test page**
- Implement `SeedTestPage.tsx`
- Step 1: subject hint input + "Start test" button
- Step 2: display seed addresses to BCC, copy-to-clipboard
- Step 3: poll `GET /seed-tests/{test_id}/result` every 10s, show spinner
- Step 4: render `SeedResultGrid.tsx` — inbox/spam/promotions per provider with colour coding

**S2-F5 — Dashboard page**
- Implement `DashboardPage.tsx` showing all domains as cards
- Each card: domain name, score ring, quick SPF/DKIM/DMARC status badges, last checked time

**S2-F6 — Alerts page**
- Implement `AlertsPage.tsx` per domain
- List existing rules with trigger + channel
- Form to add new rule (trigger select, channel select, optional Slack webhook)
- Delete button per rule

---

#### Sprint 2 Exit Criteria

- [x] Background worker processes DNS and blacklist checks automatically for all active domains daily
- [x] Health score is correctly computed and stored after every check
- [x] Blacklist check correctly identifies listed vs clean status
- [x] Full seed test flow works: create test → poll → placement results returned
- [x] Alert fires via email (testable via Mailpit) when a rule condition is met
- [x] Dashboard shows all domains with scores
- [x] Seed test UI completes the full flow end-to-end
- [x] All new tests pass (`pytest -v`) — 4/4 tests passing
- [x] Score history chart renders with real data

**Status:** ✅ SPRINT 2 COMPLETE (13 May 2026)

---

### Sprint 3 — Polish, Deployment & Launch-Ready (Weeks 5–6)

**Goal:** Production deployment, error handling, UI polish, and a README with a recorded demo. The project is portfolio-ready and optionally shareable with real users.

---

#### Backend Tasks

**S3-B1 — Error handling & logging**
- Add global exception handler in `main.py` returning consistent `{ detail: string }` JSON
- Add structured logging via Python `logging` with request ID context
- Ensure all 404, 403, 422 cases return sensible messages

**S3-B2 — Rate limiting**
- Add `slowapi` rate limiter: 10 req/min on auth endpoints, 60 req/min elsewhere
- Return `429` with `Retry-After` header

**S3-B3 — Production config**
- Add `ENVIRONMENT` setting — disable docs (`/docs`, `/redoc`) in production
- Add health check endpoint `GET /health → { status: ok }`
- Tune CORS origins for Vercel frontend URL
- Write production `Dockerfile` (multi-stage, non-root user)

**S3-B4 — Railway deployment**
- Deploy API service on Railway, pointing to Railway Postgres and Redis plugins
- Deploy worker as a separate Railway service using same repo, different start command
- Set all environment variables in Railway dashboard
- Confirm `/health` returns 200 in production

**S3-B5 — Integration tests**
- Write end-to-end integration tests covering: register → add domain → run DNS check → view results
- Run against local Docker Compose in CI (GitHub Actions)

---

#### Frontend Tasks

**S3-F1 — Toast notifications**
- Implement toast system (use `react-hot-toast` or custom)
- Show success/error toasts on: domain added, check triggered, seed test started, alert saved

**S3-F2 — Empty states & loading skeletons**
- Implement `EmptyState.tsx` for no domains, no tests, no alerts
- Add skeleton loaders for domain list and domain detail while data loads

**S3-F3 — Responsive layout**
- Ensure sidebar collapses to hamburger menu on mobile
- Domain cards stack vertically on small screens
- Seed result grid scrolls horizontally on mobile

**S3-F4 — Vercel deployment**
- Deploy frontend to Vercel, set `VITE_API_URL` to Railway production URL
- Confirm full auth + domain + DNS + seed flow works in production
- Set up Vercel preview deployments on pull requests

**S3-F5 — Placement bar chart**
- Implement `PlacementBarChart.tsx` on domain detail page
- Shows inbox / spam / promotions counts across all seed tests for that domain

**S3-F6 — Settings & profile page**
- Implement `ProfilePage.tsx` with name and email display
- Add delete account flow (confirmation modal → `DELETE /users/me`)

---

#### Documentation & Portfolio Tasks

**S3-D1 — Architecture diagram**
- Produce a clean PNG architecture diagram (use Excalidraw or draw.io)
- Save to `docs/architecture.png`

**S3-D2 — README**
- Write full README (see template in section 8)
- Include: feature list, tech stack, architecture diagram, getting started, env vars, scoring explanation, roadmap

**S3-D3 — Demo recording**
- Record a 2–3 minute Loom or GIF walkthrough: sign up → add domain → view DNS audit → run seed test → view results → receive alert
- Embed in README

**S3-D4 — Tag v1.0.0**
- Ensure `main` branch is clean and passing all tests
- Tag `v1.0.0` and create GitHub release with changelog

---

#### Sprint 3 Exit Criteria

- [ ] API deployed on Railway, returning 200 on `/health`
- [ ] Frontend deployed on Vercel, connected to production API
- [ ] Full user journey works in production (sign up through seed test results)
- [ ] Rate limiting active on auth endpoints
- [ ] No stack traces exposed in production API responses
- [ ] README complete with architecture diagram and demo link
- [ ] `v1.0.0` tagged on GitHub
- [ ] All tests passing in GitHub Actions CI

---

## 8. GitHub README Template

````markdown
# Mailscope — Email Deliverability Audit & Monitoring

Mailscope gives you full visibility into why your emails land in spam.
Connect your sending domain, get an instant health report, run seed inbox
tests across Gmail / Outlook / Yahoo, and get alerted the moment your
reputation changes.

> Built as a production-style full-stack project demonstrating async
> background jobs, DNS systems, IMAP automation, and a scoring engine.

---

## Features

- SPF, DKIM, DMARC, and MX record analysis via DNS lookup
- Real-time blacklist checks (Spamhaus ZEN, Barracuda, SORBS)
- Seed inbox testing — see if you land in inbox or spam per provider
- Daily health score (0–100) with historical trend chart
- Alerts via email or Slack when reputation drops or a blacklist hit occurs
- Multi-domain support, JWT authentication

---

## Tech Stack

**Backend** — FastAPI · PostgreSQL · Redis · Alembic · dnspython · arq  
**Frontend** — React · TypeScript · Tailwind CSS · Recharts  
**Infra** — Docker Compose · Railway (API + Worker) · Vercel (frontend)

---

## Architecture

![Architecture diagram](docs/architecture.png)

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 1. Clone

```bash
git clone https://github.com/<you>/mailscope
cd mailscope
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# fill in DB credentials, Redis URL, JWT secret, seed IMAP credentials
docker compose up --build
```

Runs on `http://localhost:8000`. API docs at `http://localhost:8000/docs`.  
Mailpit (email catcher) at `http://localhost:8025`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

Runs on `http://localhost:5173`.

---

## Environment Variables (Backend)

```env
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/mailscope
REDIS_URL=redis://redis:6379/0
JWT_SECRET=your-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM=alerts@mailscope.io
ENVIRONMENT=development
```

---

## Scoring Algorithm

| Signal | Pass | Warn | Fail |
|---|---|---|---|
| SPF | 25 pts | 12 pts | 0 pts |
| DKIM | 25 pts | 12 pts | 0 pts |
| DMARC | 20 pts | 10 pts | 0 pts |
| Blacklists | 20 pts | — | 0 pts |
| MX records | 10 pts | 5 pts | 0 pts |

Score ranges: **80–100** Healthy · **60–79** Moderate · **40–59** At risk · **0–39** Critical

---

## Roadmap

- [x] DNS audit (SPF / DKIM / DMARC / MX)
- [x] Blacklist checks
- [x] Seed inbox placement testing
- [x] Daily health score with trend chart
- [x] Email + Slack alerting
- [ ] Outlook and Yahoo OAuth for deeper placement data
- [ ] Embeddable reputation badge
- [ ] Stripe billing + freemium plan enforcement
- [ ] Telegram alert channel

---

## Running Tests

```bash
cd backend
pytest -v
```

---

## Demo

[Watch the demo →](https://loom.com/...)

---

## Author

Built by Antony as a production-style portfolio project demonstrating
backend engineering, DNS systems, async job processing, and IMAP automation.
````

---

*Last updated: May 2026*
