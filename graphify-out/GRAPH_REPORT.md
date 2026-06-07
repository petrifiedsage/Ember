# Graph Report - Ember  (2026-06-01)

## Corpus Check
- 100 files · ~18,488 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 474 nodes · 1097 edges · 39 communities (36 shown, 3 thin omitted)
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 357 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48bcafe1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `User` - 60 edges
2. `Domain` - 43 edges
3. `HTTPException` - 25 edges
4. `datetime` - 22 edges
5. `DnsRecord` - 19 edges
6. `AlertRule` - 18 edges
7. `Session` - 17 edges
8. `MetricSnapshot` - 17 edges
9. `SeedTest` - 17 edges
10. `DnsCheckResult` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Ember Deliverability Audit & Monitoring` --references--> `Ember Product Logo`  [EXTRACTED]
  README.md → frontend/public/ember-logo.svg
- `User` --uses--> `User`  [INFERRED]
  backend/app/api/users.py → backend/app/models/user.py
- `Session` --uses--> `User`  [INFERRED]
  backend/app/deps.py → backend/app/models/user.py
- `str` --uses--> `User`  [INFERRED]
  backend/app/deps.py → backend/app/models/user.py
- `User` --uses--> `User`  [INFERRED]
  backend/app/deps.py → backend/app/models/user.py

## Import Cycles
- 1-file cycle: `backend/app/main.py -> backend/app/main.py`
- 1-file cycle: `backend/app/api/v1/alerts.py -> backend/app/api/v1/alerts.py`
- 1-file cycle: `backend/app/api/v1/blacklists.py -> backend/app/api/v1/blacklists.py`
- 1-file cycle: `backend/app/api/v1/dns.py -> backend/app/api/v1/dns.py`
- 1-file cycle: `backend/app/api/v1/metrics.py -> backend/app/api/v1/metrics.py`
- 1-file cycle: `backend/app/api/v1/seed_tests.py -> backend/app/api/v1/seed_tests.py`
- 1-file cycle: `backend/app/api/v1/domains.py -> backend/app/api/v1/domains.py`

## Hyperedges (group relationships)
- **Deliverability Scoring Flow** — rationale_scoring_engine, core_scoring, models_metric_snapshot [INFERRED 0.85]
- **Domain Deliverability Audit Systems** — services_dns_checker, services_blacklist_checker, services_seed_monitor [INFERRED 0.95]

## Communities (39 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (41): AlertsPage(), LoginPage(), OAuthCallback(), RegisterPage(), PlacementBarChart(), PlacementBarChartProps, ScoreHistoryChart(), ScoreHistoryChartProps (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (44): create_inbox(), delete_inbox(), get_inboxes(), gmail_oauth_callback(), gmail_oauth_start(), Send a test email using the inbox credentials, List all inbox connections for the logged-in user, Create a new manual inbox connection (SMTP/IMAP mostly) (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (47): Domain, Request, Session, User, UUID, Request, Session, User (+39 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (25): get_me(), Return the currently authenticated user's profile, get_current_user(), add_request_id(), http_exception_handler(), lifespan(), ratelimit_exception_handler(), _run_startup_migrations() (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (32): Any, Request, Session, str, User, bool, str, create_access_token() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (34): DnsCheckResult, Domain, Request, Session, User, UUID, str, DnsCheckResult (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (29): dependencies, axios, clsx, @headlessui/react, lucide-react, qrcode.react, react, react-dom (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): 1. Clone, 2. Configure Environment, 3. Run with Docker, Ember — Email Deliverability Audit & Monitoring, Environment Variables (Backend), Features, Getting Started, Prerequisites (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (27): Domain, Request, Session, User, UUID, int, bool, int (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.39
Nodes (3): Settings, str, BaseSettings

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 13 - "Community 13"
Cohesion: 0.40
Nodes (4): int, str, Connects to the user's SMTP relay and automatically dispatches the seed test ema, send_seed_test_email()

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (14): str, BaseModel, MfaLoginRequest, MfaSetupResponse, MfaVerifyRequest, RefreshToken, Token, UserCreate (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): Run migrations in 'offline' mode.      This configures the context with just a, Run migrations in 'offline' mode.      This configures the context with just a, Run migrations in 'online' mode.      In this scenario we need to create an En, Run migrations in 'online' mode.      In this scenario we need to create an En, run_migrations_offline(), run_migrations_online()

## Knowledge Gaps
- **91 isolated node(s):** `int`, `bool`, `RequestValidationError`, `RateLimitExceeded`, `Exception` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 10`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `datetime` connect `Community 5` to `Community 2`, `Community 10`, `Community 4`, `Community 37`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `FastAPI` connect `Community 3` to `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 10`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 58 inferred relationships involving `User` (e.g. with `int` and `Request`) actually correct?**
  _`User` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 42 inferred relationships involving `Domain` (e.g. with `Domain` and `Request`) actually correct?**
  _`Domain` has 42 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `HTTPException` (e.g. with `delete_inbox()` and `gmail_oauth_callback()`) actually correct?**
  _`HTTPException` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `datetime` (e.g. with `DnsCheckResult` and `DnsRecord`) actually correct?**
  _`datetime` has 4 INFERRED edges - model-reasoned connections that need verification._