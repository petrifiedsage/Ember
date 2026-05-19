# Ember

Ember is an email deliverability audit & monitoring tool. It gives you full visibility into why your emails land in spam. Connect your sending domain, get an instant health report, run seed tests to check inbox placement, and get alerted the moment your reputation drops.

## Features
- SPF, DKIM, DMARC, and MX record analysis
- Real-time blacklist checks
- Seed inbox testing
- Daily health score (0–100)
- Alerts via email
- JWT authentication

## Tech Stack
- Backend: FastAPI, PostgreSQL, Redis, Alembic, dnspython, rq
- Frontend: React, TypeScript, Tailwind CSS
- Infra: Docker Compose

## Quick Start
```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

## Production Rollout

### Backend on Railway
1. Create a Railway project and add PostgreSQL and Redis plugins.
2. Deploy the backend from the repository root using `backend/Dockerfile`.
3. Set the backend environment variables in Railway.

```env
DATABASE_URL=postgresql+psycopg2://...
REDIS_URL=redis://...
SECRET_KEY=...
RUN_MIGRATIONS_ON_STARTUP=true
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-domain
CORS_ORIGINS=https://your-frontend-domain
SMTP_HOST=...
SMTP_PORT=1025
SMTP_FROM_EMAIL=alerts@your-domain.com
ENCRYPTION_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

4. Redeploy and confirm `GET /health` returns `200`.
5. Confirm docs are disabled in production and migrations run on startup.

### Backend Rollout Steps
1. Merge backend changes only after CI passes.
2. Let Railway deploy the new image.
3. Verify the latest migration exists and the database schema matches the models.
4. Check the `/health` endpoint and one authenticated API route.
5. Validate alert emails through Mailpit locally or SMTP in production.

### CI
The backend is validated in GitHub Actions by running migrations, the test suite, and a production-mode smoke test.
