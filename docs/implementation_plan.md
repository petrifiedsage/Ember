# 🔥 Ember — Implementation Plan

> **Project**: Email Warm-Up & Deliverability Optimizer
> **Current State**: Week 1 foundation complete (FastAPI skeleton, 2 DB tables, basic auth, React scaffold)
> **Goal**: Production-ready SaaS platform with Gmail OAuth, automated warm-up engine, spam detection, analytics dashboard, and deployment

---

## Sprint 0 — Foundation Fixes & Auth Hardening
**Duration**: 2–3 days
**Goal**: Patch the gaps in Week 1's foundation before building new features. No new features — just make what exists robust and correct.

---

### Backend

#### B0.1 — Add API versioning prefix
All routes should live under `/api/v1/`. This avoids breaking changes later.

- **Modify** [main.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/main.py)
  - Create a top-level `APIRouter` with prefix `/api/v1`
  - Include `auth_router` (and future routers) under it
- **Modify** [api/auth.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/api/auth.py)
  - Remove the `/auth` prefix from the router (it'll be composed as `/api/v1/auth/...` from main)
  - OR keep it and the full path becomes `/api/v1/auth/register`, etc.
- **Create** `app/api/router.py` — Central router file that aggregates all sub-routers

#### B0.2 — Implement refresh token flow
The current login only returns `access_token`. Add refresh token support.

- **Modify** [core/jwt.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/core/jwt.py)
  - Add `create_refresh_token(data)` — longer expiry (7 days)
  - Add `decode_refresh_token(token)` — validates refresh-specific claims
- **Modify** [schemas/token.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/schemas/token.py)
  - Update `TokenResponse` to include `refresh_token: str`
  - Add `RefreshTokenRequest` schema with `refresh_token: str`
- **Modify** [api/auth.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/api/auth.py)
  - Update `/login` to return both `access_token` and `refresh_token`
  - Add `POST /auth/refresh` endpoint — accepts refresh token, returns new access token

#### B0.3 — Create auth dependency (get_current_user)
Protected routes need a way to identify the logged-in user.

- **Create** `app/deps.py`
  - `get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User`
  - Uses `decode_token()` to extract `user_id` from JWT
  - Queries DB for user, raises `401` if invalid
  - Uses FastAPI's `OAuth2PasswordBearer` as the token scheme

#### B0.4 — Add `GET /users/me` endpoint
- **Create** `app/api/users.py`
  - `GET /users/me` — returns current logged-in user profile
  - Uses `get_current_user` dependency
  - Response model: `UserResponse`
- **Update** `app/api/router.py` to include the users router

#### B0.5 — Update InboxConnection model with missing columns
- **Modify** [models/inbox_connection.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/models/inbox_connection.py)
  - Add `smtp_host = Column(String, nullable=True)`
  - Add `imap_host = Column(String, nullable=True)`
  - Add `daily_limit = Column(Integer, default=20)`
  - Add `is_warmup_enabled = Column(Boolean, default=False)`
- **Modify** [schemas/inbox_connection.py](file:///run/media/antony/WD_BLACK/BlueRose/Ember/backend/app/schemas/inbox_connection.py)
  - Add matching fields to `InboxConnectionCreate`, `InboxConnectionUpdate`, `InboxConnectionResponse`
- **Generate** a new Alembic migration: `alembic revision --autogenerate -m "add smtp_host imap_host daily_limit to inbox_connections"`
- **Run** `alembic upgrade head`

---

### Frontend

#### F0.1 — Update API base URL for versioning
- **Modify** [services/api.ts](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/services/api.ts)
  - Change `baseURL` to include `/api/v1` suffix
  - Update auth service endpoints accordingly

#### F0.2 — Implement token refresh logic
- **Modify** [services/api.ts](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/services/api.ts)
  - Store `refresh_token` in localStorage alongside `access_token`
  - Add Axios response interceptor: on `401`, attempt token refresh via `POST /auth/refresh`
  - If refresh succeeds, retry the original request
  - If refresh fails, redirect to `/login`

#### F0.3 — Create AuthContext
- **Create** `src/context/AuthContext.tsx`
  - `AuthProvider` component wrapping the app
  - Stores `user`, `accessToken`, `isAuthenticated` in context
  - Exposes `login()`, `logout()`, `register()` functions
  - On app load, calls `GET /users/me` to validate stored token
- **Modify** [App.tsx](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/App.tsx)
  - Wrap `<Router>` with `<AuthProvider>`
  - Replace `ProtectedRoute`'s localStorage check with context

---

### ✅ Sprint 0 — Exit Criteria

- [ ] All API routes are prefixed with `/api/v1/`
- [ ] `POST /api/v1/auth/login` returns both `access_token` and `refresh_token`
- [ ] `POST /api/v1/auth/refresh` endpoint works and returns a new access token
- [ ] `GET /api/v1/users/me` returns the current user when called with a valid Bearer token
- [ ] Calling any protected endpoint without a token returns `401 Unauthorized`
- [ ] `inbox_connections` table has `smtp_host`, `imap_host`, `daily_limit`, `is_warmup_enabled` columns
- [ ] Frontend stores and uses refresh tokens; auto-refreshes on 401
- [ ] AuthContext provides user state across the app
- [ ] All existing functionality (register, login, dashboard routing) still works

---
---

## Sprint 1 — Inbox CRUD & Gmail OAuth
**Duration**: 5–7 days
**Goal**: Users can connect their Gmail account via OAuth, and the backend securely stores and manages inbox connections.

---

### Backend

#### B1.1 — Inbox CRUD endpoints
- **Create** `app/api/inboxes.py`
  - `GET /inboxes` — list all inbox connections for logged-in user
  - `POST /inboxes` — create new inbox connection (for non-OAuth or pre-OAuth step)
  - `PATCH /inboxes/{inbox_id}` — update inbox settings (pause/resume warmup, daily_limit)
  - `DELETE /inboxes/{inbox_id}` — disconnect/remove an inbox
  - All endpoints protected with `get_current_user` dependency
  - Validate that the inbox belongs to the requesting user (ownership check)
- **Update** `app/api/router.py` to include the inboxes router

#### B1.2 — Token encryption service
OAuth tokens must be stored encrypted at rest.

- **Create** `app/services/__init__.py`
- **Create** `app/services/encryption.py`
  - `encrypt_token(plaintext: str) -> str` — Fernet encryption using `ENCRYPTION_KEY` from config
  - `decrypt_token(ciphertext: str) -> str` — Fernet decryption
  - Generate a valid Fernet key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
  - Update `.env` with the generated key

#### B1.3 — Gmail OAuth service
- **Create** `app/services/gmail_oauth.py`
  - `get_google_auth_url(state: str) -> str` — builds the Google OAuth consent URL with required scopes:
    - `https://www.googleapis.com/auth/gmail.send`
    - `https://www.googleapis.com/auth/gmail.readonly`
    - `https://www.googleapis.com/auth/gmail.modify`
  - `exchange_code_for_tokens(code: str) -> dict` — exchanges auth code for access + refresh tokens via Google's token endpoint
  - `refresh_access_token(refresh_token: str) -> dict` — refreshes an expired Google access token
  - `get_user_email(access_token: str) -> str` — calls Gmail API to get the authenticated user's email address

#### B1.4 — OAuth callback endpoint
- **Add to** `app/api/inboxes.py`
  - `GET /inboxes/oauth/gmail/start` — returns the Google OAuth URL (with a state param tied to the user)
  - `GET /inboxes/oauth/callback` — handles Google's redirect:
    1. Receives `code` and `state` query params
    2. Exchanges code for tokens via `gmail_oauth.exchange_code_for_tokens()`
    3. Gets the Gmail address via `get_user_email()`
    4. Encrypts tokens via `encryption.encrypt_token()`
    5. Creates or updates an `InboxConnection` record
    6. Redirects to frontend success page

#### B1.5 — Test sending a basic email via Gmail API
- **Create** `app/services/email_client.py`
  - `GmailClient` class:
    - `__init__(self, access_token: str)` — initializes with decrypted OAuth token
    - `send_email(to: str, subject: str, body: str) -> dict` — sends email using Gmail API (not SMTP)
    - `list_messages(query: str, max_results: int) -> list` — lists messages matching a query
    - `get_message(message_id: str) -> dict` — gets full message details including headers
  - Uses `google-auth` and `requests` (already in requirements.txt)
- **Add to** `app/api/inboxes.py`
  - `POST /inboxes/{inbox_id}/test` — sends a test email to verify the connection works
    - Decrypts stored tokens
    - Refreshes if expired
    - Sends a simple test message
    - Returns success/failure

---

### Frontend

#### F1.1 — Create layout components
- **Create** `src/components/layout/Sidebar.tsx`
  - Navigation links: Dashboard, Inboxes, Metrics (future), Settings (future)
  - Active route highlighting
  - User info at bottom with logout button
- **Create** `src/components/layout/Navbar.tsx`
  - Page title display
  - User avatar / account dropdown
- **Create** `src/components/layout/AppLayout.tsx`
  - Sidebar + Navbar + main content area wrapper
  - Responsive: sidebar collapses on mobile
- **Modify** [App.tsx](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/App.tsx)
  - Wrap authenticated routes with `AppLayout`

#### F1.2 — Inboxes list page
- **Create** `src/pages/inboxes/InboxesListPage.tsx`
  - Fetches `GET /inboxes` on mount
  - Displays connected inboxes as cards showing: email, provider, status, warmup toggle
  - Empty state with CTA: "Connect your first inbox"
  - "Connect Gmail" button triggers OAuth flow
- **Create** `src/services/inboxService.ts`
  - `getInboxes()`, `deleteInbox(id)`, `updateInbox(id, data)`, `startGmailOAuth()`, `sendTestEmail(id)`

#### F1.3 — Gmail OAuth connection flow
- **Create** `src/pages/inboxes/ConnectInboxPage.tsx`
  - Button: "Connect Gmail Account"
  - On click: calls `GET /inboxes/oauth/gmail/start` to get the OAuth URL
  - Opens Google OAuth consent screen (redirect or popup)
- **Create** `src/pages/inboxes/OAuthCallbackPage.tsx`
  - Landing page after Google redirects back
  - Shows success/error message
  - Auto-redirects to Inboxes list after 3 seconds
- **Update** [App.tsx](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/App.tsx) — add routes for new pages

#### F1.4 — Common UI components
- **Create** `src/components/common/Button.tsx` — reusable styled button with variants (primary, secondary, danger, ghost)
- **Create** `src/components/common/Card.tsx` — card container with header/body/footer slots
- **Create** `src/components/common/Badge.tsx` — status badges (active, paused, error)
- **Create** `src/components/common/Loader.tsx` — spinner/skeleton loader
- **Create** `src/components/common/Toast.tsx` — toast notification system (success, error, info)

---

### ✅ Sprint 1 — Exit Criteria

- [ ] `GET /api/v1/inboxes` returns the user's connected inboxes
- [ ] `POST /api/v1/inboxes` creates a new inbox record
- [ ] `PATCH /api/v1/inboxes/{id}` updates inbox settings
- [ ] `DELETE /api/v1/inboxes/{id}` removes an inbox
- [ ] `GET /api/v1/inboxes/oauth/gmail/start` returns a valid Google OAuth URL
- [ ] `GET /api/v1/inboxes/oauth/callback` successfully exchanges code for tokens and creates an InboxConnection
- [ ] OAuth tokens are stored **encrypted** in the database (verified by inspecting the DB row)
- [ ] `POST /api/v1/inboxes/{inbox_id}/test` sends a real test email via Gmail API
- [ ] Frontend: User can click "Connect Gmail", complete OAuth, and see the inbox appear in their list
- [ ] Frontend: Inboxes page shows all connected inboxes with status
- [ ] Frontend: App has a proper layout (sidebar + navbar)
- [ ] Frontend: Reusable UI component library exists (Button, Card, Badge, Loader, Toast)
- [ ] Ownership enforcement: user A cannot access user B's inboxes

---
---

## Sprint 2 — Warm-Up Engine & Queue System
**Duration**: 7–10 days
**Goal**: Build the core warm-up engine that automatically sends and replies to emails on a schedule, powered by a background job queue.

---

### Backend

#### B2.1 — Create WarmupTask and WarmupMetric models
- **Create** `app/models/warmup_task.py`
  ```
  warmup_tasks:
    id (PK)
    inbox_id (FK → inbox_connections.id)
    target_email (String) — the recipient email
    subject (String)
    body (Text)
    scheduled_time (DateTime)
    executed_at (DateTime, nullable)
    status (String) — pending | sent | replied | failed
    error_message (Text, nullable)
    created_at, updated_at
  ```
- **Create** `app/models/warmup_metric.py`
  ```
  warmup_metrics:
    id (PK)
    inbox_id (FK → inbox_connections.id)
    date (Date) — aggregation date
    sent_count (Integer, default=0)
    reply_count (Integer, default=0)
    spam_count (Integer, default=0)
    bounce_count (Integer, default=0)
    open_count (Integer, default=0)
    created_at, updated_at
  ```
- **Update** `app/models/__init__.py` to export new models
- **Create** corresponding Pydantic schemas in `app/schemas/warmup.py`
- **Generate + run** Alembic migration

#### B2.2 — Redis queue setup
- **Add** `redis`, `rq` (or `celery`) to `requirements.txt`
- **Create** `app/workers/__init__.py`
- **Create** `app/workers/queue.py`
  - Redis connection factory
  - Named queues: `warmup_send`, `warmup_reply`, `warmup_check`
- **Create** `app/workers/worker.py`
  - RQ worker entrypoint (or Celery worker)
  - Can be started via: `python -m app.workers.worker`

#### B2.3 — Random content generators
- **Create** `app/utils/__init__.py`
- **Create** `app/utils/random_text.py`
  - `generate_subject() -> str` — returns a random human-like email subject from a pool of 50+ templates
  - `generate_body(sender_name: str) -> str` — returns a randomized, human-sounding email body (varies in length, tone, and structure)
  - `generate_delay() -> int` — returns a random delay in seconds (60–3600) to humanize timing

#### B2.4 — Warm-up engine service
- **Create** `app/services/warmup_engine.py`
  - `create_daily_tasks(inbox: InboxConnection) -> list[WarmupTask]`
    - For each active inbox with `is_warmup_enabled=True`
    - Creates `daily_limit` number of tasks spread across the day (random times)
    - Pairs with other connected inboxes in the system (warm-up pool)
    - Uses random subjects + bodies from `random_text.py`
  - `execute_send_task(task_id: int)`
    - Picks up a WarmupTask, decrypts tokens, sends email via `GmailClient`
    - Updates task status to `sent` or `failed`
    - Enqueues a reply task for the recipient's inbox (if it's also in the system)
  - `execute_reply_task(task_id: int)`
    - Fetches the original email, generates a reply body
    - Sends reply from the recipient inbox
    - Updates task status to `replied`

#### B2.5 — Scheduler (daily task creation)
- **Create** `app/workers/scheduler.py`
  - Uses `APScheduler` or a simple cron-like loop
  - Runs daily at midnight (configurable)
  - Queries all active inboxes with `is_warmup_enabled=True`
  - Calls `warmup_engine.create_daily_tasks()` for each
  - Enqueues all created tasks to the Redis queue at their scheduled times
- **Add** `apscheduler` to `requirements.txt`

#### B2.6 — Warm-up API endpoints
- **Create** `app/api/warmup.py`
  - `POST /warmup/{inbox_id}/start` — enables warm-up for an inbox (sets `is_warmup_enabled=True`)
  - `POST /warmup/{inbox_id}/stop` — disables warm-up
  - `GET /warmup/{inbox_id}/schedule` — returns upcoming/recent warmup tasks with status
  - `GET /warmup/{inbox_id}/status` — returns current warmup state (enabled, tasks today, next scheduled)
- **Update** `app/api/router.py`

---

### Frontend

#### F2.1 — Inbox detail page with warmup controls
- **Create** `src/pages/inboxes/InboxDetailPage.tsx`
  - Shows inbox info (email, provider, connected date)
  - Warm-up toggle (start/stop)
  - Daily limit slider/input
  - Recent warm-up activity feed (list of tasks with status badges)
  - "Send Test Email" button
- **Update** `src/services/inboxService.ts`
  - Add `startWarmup(id)`, `stopWarmup(id)`, `getWarmupSchedule(id)`, `getWarmupStatus(id)`

#### F2.2 — Update dashboard with warm-up overview
- **Modify** [DashboardPage.tsx](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/src/pages/DashboardPage.tsx)
  - Summary cards: Total inboxes, Active warm-ups, Emails sent today, Emails replied today
  - Quick status list: each inbox with warmup badge (active/paused/error)
  - "Connect new inbox" CTA if no inboxes exist

#### F2.3 — Warm-up activity components
- **Create** `src/components/inbox/WarmupStatusChip.tsx` — colored chip showing status (active, paused, warming, error)
- **Create** `src/components/inbox/TaskActivityItem.tsx` — single row showing: time, recipient, subject, status
- **Create** `src/components/inbox/WarmupControls.tsx` — start/stop toggle + daily limit controls as a reusable component

---

### ✅ Sprint 2 — Exit Criteria

- [ ] `warmup_tasks` and `warmup_metrics` tables exist in the database
- [ ] Redis is connected and the worker process starts without errors
- [ ] `POST /api/v1/warmup/{inbox_id}/start` enables warm-up and tasks get created
- [ ] `POST /api/v1/warmup/{inbox_id}/stop` disables warm-up
- [ ] The scheduler creates daily warm-up tasks for each active inbox
- [ ] The worker picks up tasks and sends real emails via Gmail API
- [ ] Auto-reply: when inbox A sends to inbox B (both in the system), B auto-replies
- [ ] `GET /api/v1/warmup/{inbox_id}/schedule` returns task list with correct statuses
- [ ] Emails have randomized, human-like subjects and bodies (not identical)
- [ ] Emails are sent at randomized intervals (not all at once)
- [ ] Frontend: Inbox detail page shows warmup controls and activity feed
- [ ] Frontend: Dashboard shows summary cards with live data
- [ ] Worker can run as a separate process alongside the API

---
---

## Sprint 3 — Spam Detection, Metrics & Analytics Dashboard
**Duration**: 7–10 days
**Goal**: Detect where emails land (inbox vs spam), collect daily metrics, and build a full analytics dashboard with charts.

---

### Backend

#### B3.1 — Spam / inbox placement detection
- **Create** `app/services/spam_detector.py`
  - `check_email_placement(inbox: InboxConnection, message_id: str) -> str`
    - Uses Gmail API to fetch the message and inspect its `labelIds`
    - Returns placement: `"primary"`, `"promotions"`, `"spam"`, `"unknown"`
  - `check_bounce(inbox: InboxConnection, message_id: str) -> bool`
    - Checks for bounce headers (`X-Failed-Recipients`, etc.)
  - `run_placement_check(inbox_id: int)`
    - Scheduled job: for each sent warm-up email, check where it landed in the recipient's inbox
    - Updates the corresponding `WarmupTask` record
    - Increments the daily `WarmupMetric` counters

#### B3.2 — Metrics collection service
- **Create** `app/services/metrics_collector.py`
  - `update_daily_metrics(inbox_id: int, date: date)`
    - Aggregates task results for the day: count sent, replied, spam, bounced
    - Creates or updates a `WarmupMetric` row
  - `calculate_reputation_score(inbox_id: int) -> int`
    - Weighted formula: `score = 100 - (spam_rate * 50) - (bounce_rate * 30) + (reply_rate * 20)`
    - Returns 0–100 integer

#### B3.3 — Metrics API endpoints
- **Create** `app/api/metrics.py`
  - `GET /metrics/{inbox_id}/daily?from=YYYY-MM-DD&to=YYYY-MM-DD`
    - Returns daily metrics array within the date range
    - Response: `[{ date, sent_count, reply_count, spam_count, bounce_count, open_count }]`
  - `GET /metrics/{inbox_id}/summary`
    - Returns aggregate stats + reputation score
    - Response: `{ inbox_id, reputation_score, total_sent, total_spam, total_bounced, reply_rate, spam_rate }`
  - `GET /metrics/overview`
    - Returns system-wide summary for all user's inboxes
    - Quick stats for the dashboard summary cards
- **Update** `app/api/router.py`

#### B3.4 — Scheduled metrics + placement checks
- **Update** `app/workers/scheduler.py`
  - Add a job that runs every 2 hours: for each active inbox, run `spam_detector.run_placement_check()`
  - Add a job that runs at end of day: for each inbox, run `metrics_collector.update_daily_metrics()`

---

### Frontend

#### F3.1 — Install and configure charting library
- **Install** `recharts` (or `chart.js` + `react-chartjs-2`)
  - `npm install recharts` (recommended — React-native, composable, TypeScript-friendly)
- **Create** `src/components/charts/LineChart.tsx` — generic line chart wrapper
- **Create** `src/components/charts/BarChart.tsx` — generic bar chart wrapper
- **Create** `src/components/charts/PieChart.tsx` — for spam vs inbox vs promotions breakdown

#### F3.2 — Inbox metrics page
- **Create** `src/pages/metrics/InboxMetricsPage.tsx`
  - Date range picker (from/to)
  - Line chart: sent vs replies vs spam over time
  - Bar chart: daily volume breakdown
  - Pie chart: inbox placement distribution (primary/promotions/spam)
  - Stats cards: reputation score (with color coding), total sent, reply rate, spam rate
- **Create** `src/services/metricsService.ts`
  - `getDailyMetrics(inboxId, from, to)`, `getMetricsSummary(inboxId)`, `getOverview()`

#### F3.3 — Enhanced dashboard with charts
- **Modify** `src/pages/DashboardPage.tsx`
  - Replace placeholder content with real data from `GET /metrics/overview`
  - Add a mini line chart: 7-day trend of emails sent across all inboxes
  - Add reputation score gauges per inbox
  - Quick link cards to each inbox's detail metrics page

#### F3.4 — Reputation score component
- **Create** `src/components/metrics/ReputationGauge.tsx`
  - Circular or semi-circular gauge showing 0–100 score
  - Color coded: 0–40 red, 40–70 yellow, 70–100 green
  - Animated on load
- **Create** `src/components/metrics/StatCard.tsx`
  - Reusable stat card showing: label, value, trend arrow (up/down), percentage change

---

### ✅ Sprint 3 — Exit Criteria

- [ ] Spam detection runs automatically and correctly identifies primary/spam/promotions placement
- [ ] Bounce detection works for bounced emails
- [ ] `warmup_metrics` table is being populated daily with correct aggregated data
- [ ] `GET /api/v1/metrics/{inbox_id}/daily` returns accurate time-series data
- [ ] `GET /api/v1/metrics/{inbox_id}/summary` returns reputation score and aggregate stats
- [ ] `GET /api/v1/metrics/overview` returns system-wide summary
- [ ] Reputation score formula produces sensible 0–100 values
- [ ] Frontend: Inbox metrics page renders with working charts (line, bar, pie)
- [ ] Frontend: Dashboard shows real summary data and mini trend charts
- [ ] Frontend: Reputation gauges display per-inbox scores with color coding
- [ ] Scheduled jobs (placement check + daily metrics) run reliably in the background

---
---

## Sprint 4 — Settings, Error Handling & Testing
**Duration**: 5–7 days
**Goal**: Add user settings, comprehensive error handling, toast notifications, and a solid test suite.

---

### Backend

#### B4.1 — User settings & profile management
- **Modify** `app/api/users.py`
  - `PATCH /users/me` — update profile (name, password change)
  - `DELETE /users/me` — deactivate account (soft delete: sets `is_active=False`)
- **Create** `app/schemas/user.py` — add `UserPasswordChange` schema (old_password, new_password)

#### B4.2 — Comprehensive error handling
- **Create** `app/core/exceptions.py`
  - Define custom exception classes: `InboxNotFoundError`, `OAuthError`, `TokenExpiredError`, `PermissionDeniedError`
  - Register global exception handlers in `main.py` that return consistent JSON error responses:
    ```json
    { "detail": "message", "error_code": "INBOX_NOT_FOUND", "status_code": 404 }
    ```

#### B4.3 — Logging infrastructure
- **Create** `app/utils/logging.py`
  - Structured logging setup (JSON format)
  - Log levels: INFO for normal operations, WARNING for retries/edge cases, ERROR for failures
  - Request logging middleware: log every API request with method, path, status, duration
- **Update** `main.py` to add logging middleware

#### B4.4 — Backend test suite
- **Create** `backend/tests/__init__.py`
- **Create** `backend/tests/conftest.py`
  - Test database setup (SQLite in-memory or test PostgreSQL)
  - Test client fixture using FastAPI's `TestClient`
  - User factory fixtures
- **Create** `backend/tests/test_auth.py`
  - Test register (success + duplicate email)
  - Test login (success + wrong password + nonexistent user)
  - Test refresh token flow
  - Test protected route without token → 401
- **Create** `backend/tests/test_inboxes.py`
  - Test CRUD operations
  - Test ownership enforcement (user A can't access user B's inbox)
- **Create** `backend/tests/test_warmup.py`
  - Test start/stop warmup
  - Test task creation logic
- **Add** `pytest`, `httpx` to `requirements.txt`

---

### Frontend

#### F4.1 — Settings page
- **Create** `src/pages/settings/ProfilePage.tsx`
  - Edit name form
  - Change password form (old + new + confirm)
  - Connected inboxes count
  - Deactivate account button (with confirmation modal)

#### F4.2 — Global error handling & toast system
- **Create** `src/context/ToastContext.tsx`
  - `showToast(message, type)` — types: success, error, warning, info
  - Auto-dismiss after 5 seconds
  - Stacking support (multiple toasts)
- **Create** `src/components/common/Modal.tsx` — confirmation dialog for destructive actions
- **Update** API interceptors to show toasts on error responses
- **Update** all forms to show success/error toasts

#### F4.3 — Loading states & empty states
- Audit all pages and add:
  - Skeleton loaders while data is fetching
  - Empty state illustrations/messages when no data exists
  - Error states with retry buttons when API calls fail
- **Create** `src/components/common/EmptyState.tsx`
- **Create** `src/components/common/ErrorState.tsx`

#### F4.4 — Responsive polish
- Audit all pages for mobile responsiveness
- Sidebar should collapse to a hamburger menu on mobile
- Charts should resize appropriately
- Forms should stack vertically on small screens

---

### ✅ Sprint 4 — Exit Criteria

- [ ] `PATCH /api/v1/users/me` updates user profile
- [ ] Password change validates old password before allowing update
- [ ] All API errors return consistent JSON format with error codes
- [ ] Structured logging captures all requests and errors
- [ ] `pytest` runs with 80%+ code coverage on auth, inboxes, and warmup modules
- [ ] Frontend: Settings page works for profile editing and password change
- [ ] Frontend: Toast notifications appear for all success/error scenarios
- [ ] Frontend: All pages have proper loading, empty, and error states
- [ ] Frontend: App is usable on mobile screens (sidebar collapses, forms stack)
- [ ] No unhandled exceptions in backend or frontend console

---
---

## Sprint 5 — Docker, Deployment & Final Polish
**Duration**: 5–7 days
**Goal**: Containerize everything, deploy to production, write documentation, and prepare for portfolio showcase.

---

### Backend

#### B5.1 — Docker setup
- **Create** `backend/Dockerfile`
  - Python 3.11 base image
  - Install dependencies from requirements.txt
  - Run with uvicorn in production mode
- **Create** `docker-compose.yml` (project root)
  - Services: `api` (FastAPI), `worker` (RQ/Celery worker), `scheduler`, `db` (PostgreSQL), `redis`
  - Shared volume for logs
  - Health checks for each service
  - Environment variables from `.env`
- **Create** `backend/Dockerfile.worker` (separate image for worker process)

#### B5.2 — Production configuration
- **Modify** `app/config.py`
  - Add `ENVIRONMENT` setting: `development` | `staging` | `production`
  - Disable debug mode in production
  - Restrict CORS origins in production (no `*` wildcard)
- **Create** `.env.production.example` — template with all required production variables

#### B5.3 — Usage limits
- **Modify** `app/models/user.py` — add `plan = Column(String, default="free")`
- **Create** `app/core/rate_limiter.py`
  - Free plan: max 1 inbox connection, max 10 warmup emails/day
  - Check limits before creating inboxes or warmup tasks
  - Return `403` with upgrade message when limit exceeded

#### B5.4 — Security hardening
- Rate limiting on auth endpoints (prevent brute force)
- Input validation audit across all endpoints
- Ensure SQL injection protection (parameterized queries via SQLAlchemy)
- Ensure no sensitive data in logs (mask tokens, passwords)

---

### Frontend

#### F5.1 — Docker setup
- **Create** `frontend/Dockerfile`
  - Node.js base image
  - Build the production bundle
  - Serve with nginx
- **Create** `frontend/nginx.conf` — serves SPA with proper routing fallback

#### F5.2 — SEO & meta tags
- **Modify** [index.html](file:///run/media/antony/WD_BLACK/BlueRose/Ember/frontend/index.html)
  - Add proper `<title>`, `<meta name="description">`, Open Graph tags
  - Add favicon

#### F5.3 — Landing page (optional but recommended)
- **Create** `src/pages/LandingPage.tsx`
  - Hero section with product description
  - Feature highlights (3–4 cards)
  - CTA: "Get Started" → Register
  - Tech stack or "How it works" section
- Only shown to unauthenticated users at `/`

#### F5.4 — Final UI polish
- Consistent color palette and typography audit
- Smooth page transitions / animations
- Dark mode support (CSS custom properties toggle)
- Favicon and app icons
- Performance audit (lazy loading routes, code splitting)

---

### Documentation & Showcase

#### D5.1 — README overhaul
- **Modify** [README.md](file:///run/media/antony/WD_BLACK/BlueRose/Ember/README.md)
  - Add architecture diagram (Mermaid or PNG)
  - Screenshots / GIFs of the dashboard, inbox connection flow, metrics charts
  - Proper setup instructions for Docker one-command start
  - API documentation link (FastAPI auto-docs at `/docs`)
  - Tech stack badges

#### D5.2 — Architecture diagram
- **Create** `docs/architecture.md` (or PNG)
  - System components: API, Worker, Scheduler, DB, Redis, Gmail API
  - Data flow diagrams
  - Entity relationship diagram

---

### ✅ Sprint 5 — Exit Criteria

- [ ] `docker-compose up` starts the entire stack (API + worker + scheduler + DB + Redis) in one command
- [ ] The app is deployed and accessible via a public URL
- [ ] CORS is properly restricted in production
- [ ] Free plan limits are enforced (1 inbox, 10 emails/day)
- [ ] Auth endpoints have rate limiting
- [ ] Frontend production build serves correctly via nginx
- [ ] README has architecture diagram, screenshots, setup instructions, and API docs link
- [ ] All environment variables are documented in `.env.production.example`
- [ ] The deployed version can: register → connect Gmail → start warmup → view metrics
- [ ] The project is portfolio-ready and presentable in an interview

---
---

## Timeline Summary

| Sprint | Focus | Duration | Key Outcome |
|--------|-------|----------|-------------|
| **Sprint 0** | Foundation fixes & auth hardening | 2–3 days | Robust auth, API versioning, protected routes |
| **Sprint 1** | Inbox CRUD & Gmail OAuth | 5–7 days | Users connect Gmail, tokens encrypted, test email works |
| **Sprint 2** | Warm-up engine & queue system | 7–10 days | Automated send/reply, background jobs, scheduling |
| **Sprint 3** | Spam detection, metrics & analytics | 7–10 days | Placement tracking, daily metrics, charts dashboard |
| **Sprint 4** | Settings, errors & testing | 5–7 days | Polish, test suite, error handling, mobile responsive |
| **Sprint 5** | Docker, deployment & showcase | 5–7 days | Dockerized, deployed, portfolio-ready |

**Total estimated time: 5–7 weeks**
