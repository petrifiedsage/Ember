# Ember — Email Deliverability Audit & Monitoring

Ember gives you full visibility into why your emails land in spam.
Connect your sending domain, get an instant health report, run seed inbox
tests across Gmail / Outlook / Yahoo, and get alerted the moment your
reputation changes.

> Built as a production-style full-stack project demonstrating async
> background jobs, DNS systems, IMAP automation, and a scoring engine.

---

## Features

- **DNS Audit:** SPF, DKIM, DMARC, and MX record analysis via DNS lookup
- **Blacklists:** Real-time blacklist checks (Spamhaus ZEN, Barracuda, SORBS)
- **Seed Inbox Testing:** 1-Click SMTP Auto-Send to see if you land in inbox or spam per provider
- **Intelligence:** Daily health score (0–100) with historical trend chart and placement charts
- **Alerting:** Email or Slack alerts when reputation drops or a blacklist hit occurs
- **Multi-tenant:** Multi-domain support, JWT authentication, rate limiting

---

## Tech Stack

**Backend** — FastAPI · PostgreSQL · Redis · Alembic · dnspython · arq  
**Frontend** — React · TypeScript · Tailwind CSS · Recharts · Lucide  
**Infra** — Docker Compose · Vercel

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 1. Clone

```bash
git clone https://github.com/your-username/ember
cd ember
```

### 2. Configure Environment

```bash
# Setup Backend ENV
cd backend
cp .env.example .env
# Fill in your OAuth, SMTP, and DB credentials
cd ..

# Setup Frontend ENV
cd frontend
cp .env.example .env.local
cd ..
```

### 3. Run with Docker

The entire stack (Frontend, Backend, Database, Redis, Background Worker, and Mailpit) is containerized and orchestrated via Docker Compose.

```bash
docker compose up --build
```

**Services:**
- Frontend App: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger API Docs: `http://localhost:8000/docs`
- Mailpit (SMTP UI): `http://localhost:8025`

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
SMTP_FROM=alerts@ember.io
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
