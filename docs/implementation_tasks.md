# Ember Implementation Tasks

This document translates the redesigned plan into sprint-ready execution tasks grouped by backend and frontend, with explicit exit criteria for each sprint.

---

## Sprint 1 (Week 1-2): Foundation

### Backend Tasks

- [x] Establish backend project structure under `backend/app`:
  - [x] `main.py` FastAPI app entrypoint with API router mounting at `/api/v1`
  - [x] `config.py` for `pydantic-settings` based configuration
  - [x] `deps.py` for DB session dependency and current user injection
  - [x] `core/security.py` for password hashing and JWT issue/verify
  - [x] `db/base.py` and `db/session.py` finalized and imported correctly
- [x] Infrastructure and bootstrapping:
  - [x] Confirm `.env.example` contains required settings for API, Postgres, Redis, JWT, SMTP placeholders
  - [x] Ensure `Dockerfile` and `docker-compose.yml` run API + Postgres + Redis together
  - [x] Add pre-commit hooks (formatting + lint baseline)
- [x] Data models + migrations:
  - [x] Implement/validate SQLAlchemy models for `User`, `Domain`, `DnsRecord`, `BlacklistResult`, `MetricSnapshot`
  - [x] Wire Alembic metadata in migration env
  - [x] Generate and apply initial migration successfully
- [x] Auth API:
  - [x] `POST /auth/register`
  - [x] `POST /auth/login`
  - [x] `POST /auth/refresh`
  - [x] `GET /users/me`
  - [x] Enforce auth on protected routes
- [x] Domain management:
  - [x] `GET /domains` list user domains
  - [x] `POST /domains` add domain with domain format validation
  - [x] `DELETE /domains/{domain_id}` delete tracked domain
- [x] DNS checking baseline:
  - [x] Implement `services/dns_checker.py` with SPF, DKIM, DMARC, MX lookups via `dnspython`
  - [x] Implement `GET /dns/{domain_id}/latest`
  - [x] If no cached result exists, run synchronous first check and persist result

### Frontend Tasks

- [x] Create frontend scaffold under `frontend/`:
  - [x] Vite + React + TypeScript + Tailwind initialized
  - [x] Router + base app shell (`Sidebar`, `Navbar`, `PageContainer`)
  - [x] API client setup with base URL and token attachment
- [x] Authentication UI:
  - [x] `LoginPage`
  - [x] `RegisterPage`
  - [x] Auth context (`AuthContext`) and `useAuth` hook
  - [x] Protected route handling and redirect flow
- [x] Domain management UI:
  - [x] Domains list page with basic cards/table
  - [x] Add domain page/form with validation and error states
  - [x] Delete domain action with confirmation
- [x] DNS latest view:
  - [x] Domain detail page shows SPF/DKIM/DMARC/MX status rows
  - [x] Pass/warn/fail visual badges and raw record values

### Exit Criteria (Sprint 1)

- [ ] `docker compose up --build` starts API, Postgres, and Redis without runtime import errors
- [ ] Initial migration applies cleanly on empty DB
- [ ] Auth flow works end-to-end (register -> login -> access protected endpoint)
- [ ] User can add/list/delete domains from API and frontend UI
- [ ] DNS latest endpoint returns structured status payload for tracked domains
- [ ] Basic test coverage exists for auth, domain CRUD, and DNS parser/check logic

---

## Sprint 2 (Week 3-4): Core Intelligence

### Backend Tasks

- [ ] Queue and worker setup:
  - [ ] Choose and implement queue stack (`rq` or `arq`) in `workers/queue.py`
  - [ ] Add `workers/tasks.py` for enqueue-able DNS/blacklist/seed tasks
  - [ ] Add worker service in `docker-compose.yml`
- [ ] Scheduler:
  - [ ] Implement `workers/scheduler.py` with APScheduler daily jobs
  - [ ] Daily cron enqueues checks for all active domains
- [ ] Background DNS pipeline:
  - [ ] Persist DNS run results to `DnsRecord`
  - [ ] Update domain-level status/last checked fields
- [ ] Blacklist checks:
  - [ ] Implement `services/blacklist_checker.py` for Spamhaus ZEN, Barracuda, SORBS
  - [ ] Persist results to `BlacklistResult`
  - [ ] Add endpoints:
    - [ ] `GET /blacklists/{domain_id}/latest`
    - [ ] `POST /blacklists/{domain_id}/run`
- [ ] Scoring engine:
  - [ ] Implement `core/scoring.py` and `services/scorer.py`
  - [ ] Weighted score 0-100 using SPF, DKIM, DMARC, blacklist, MX
  - [ ] Save daily score in `MetricSnapshot`
- [ ] Seed test flow:
  - [ ] Add model(s): `SeedTest` and provider-level result table/structure
  - [ ] Implement `services/seed_monitor.py` for IMAP polling loop
  - [ ] Implement endpoints:
    - [ ] `POST /seed-tests/{domain_id}/run`
    - [ ] `GET /seed-tests/{domain_id}`
    - [ ] `GET /seed-tests/{test_id}/result`
- [ ] Metrics endpoints:
  - [ ] `GET /metrics/{domain_id}/score-history`
  - [ ] `GET /metrics/{domain_id}/summary`

### Frontend Tasks

- [ ] Domain detail intelligence UI:
  - [ ] "Run DNS check now" action with loading + success/failure feedback
  - [ ] Blacklist latest status display + manual rerun
  - [ ] Score visualization (`ScoreRing`) and trend chart (`ScoreHistoryChart`)
- [ ] Seed test UX:
  - [ ] Seed test trigger form (`subject`)
  - [ ] Display returned seed addresses and expiry
  - [ ] Poll test status until complete/timeout
  - [ ] Render provider placement grid (`SeedResultGrid`)
- [ ] Dashboard metrics:
  - [ ] Cross-domain overview cards (health score, warnings, last check)
  - [ ] Quick links to domain detail and seed test pages
- [ ] Service layer expansion:
  - [ ] `domainService`, `seedTestService`, `metricsService` align with backend contracts
  - [ ] Error handling and empty states for all new views

### Exit Criteria (Sprint 2)

- [ ] Worker and scheduler run continuously in containers
- [ ] Daily background jobs generate DNS + blacklist data without manual triggering
- [ ] Health score calculation persists and updates snapshots daily
- [ ] Seed test lifecycle works end-to-end (run -> await email -> complete results)
- [ ] Metrics endpoints return valid history/summary for populated domains
- [ ] Frontend reflects live background state (polling + status transitions)
- [ ] Automated tests cover scoring, blacklist checks, and seed-test orchestration

---

## Sprint 3 (Week 5-6): Alerts, Polish, and Deployment

### Backend Tasks

- [ ] Alerts domain modeling:
  - [ ] Implement `models/alert.py` for rules and delivery logs
  - [ ] Add schemas and API routes:
    - [ ] `GET /alerts/{domain_id}`
    - [ ] `POST /alerts/{domain_id}`
    - [ ] `DELETE /alerts/{alert_id}`
- [ ] Alert evaluation and dispatch:
  - [ ] Implement `services/alerting.py` rule evaluation hooks on each check cycle
  - [ ] Implement `utils/email_sender.py` SMTP integration for alert sends
  - [ ] Add Slack webhook sender path for `channel=slack`
- [ ] Reliability and observability:
  - [ ] Structured logging in `utils/logging.py`
  - [ ] Harden retries/timeouts for DNS, blacklist, and IMAP operations
  - [ ] Add idempotency guards for repeated worker executions
- [ ] API hardening:
  - [ ] Validate ownership access checks on all domain-scoped resources
  - [ ] Return consistent error schema across endpoints
  - [ ] Add pagination for list endpoints where needed
- [ ] Documentation and deployment:
  - [ ] Finalize README with architecture diagram and scoring section
  - [ ] Configure deployment targets (Railway backend, Vercel frontend)
  - [ ] Confirm environment variable docs are complete and accurate

### Frontend Tasks

- [ ] Alerts management UI:
  - [ ] Alerts list page per domain
  - [ ] Create alert rule form (`trigger`, `channel`)
  - [ ] Delete alert action with confirmation
- [ ] Dashboard/domain polish:
  - [ ] Refine component states (loading, empty, error, success)
  - [ ] Improve score + status visual consistency
  - [ ] Add responsive behavior for desktop/tablet baseline
- [ ] Seed test page polish:
  - [ ] Clarify user instructions for sending the BCC test email
  - [ ] Add timeout and retry guidance
- [ ] QA and release prep:
  - [ ] End-to-end user flow verification from auth to alerts
  - [ ] Prepare demo-ready UI state and seeded sample data

### Exit Criteria (Sprint 3)

- [ ] Alerts trigger correctly from real check outcomes and are delivered by configured channels
- [ ] Full UX is production-like across auth, domains, DNS, blacklists, seed tests, metrics, and alerts
- [ ] Logging and retry behavior provide actionable diagnostics for failures
- [ ] Deployment is live (or deployment scripts/config are validated and reproducible)
- [ ] README clearly documents setup, architecture, scoring logic, and demo workflow
- [ ] A complete demo flow runs without manual DB edits or code changes

---

## Global Definition of Done

- [ ] API endpoints conform to `/api/v1` contracts in the spec
- [ ] Background jobs are observable, retry-safe, and do not block API responsiveness
- [ ] Data model + migrations are forward-compatible for future billing/multi-tenant features
- [ ] Frontend and backend use consistent DTO/schema contracts
- [ ] Core flows are covered by automated tests and a manual smoke checklist
