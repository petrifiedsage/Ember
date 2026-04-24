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
