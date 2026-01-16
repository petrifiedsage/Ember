# Quick Start Reference 🚀

## TL;DR - Get Everything Running in 3 Minutes

### Terminal 1: Database
```bash
docker run --name warmup-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=email_warmup -p 5432:5432 -d postgres
```

### Terminal 2: Backend
```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS/Linux
alembic upgrade head
uvicorn app.main:app --reload
```

### Terminal 3: Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 4: Test
```bash
curl http://localhost:8000/
# Should return: {"message": "Email Warmup API running 🚀"}
```

---

## Project Structure at a Glance

```
email-warmup/
├─ backend/
│  ├─ app/
│  │  ├─ main.py          ← FastAPI app entry
│  │  ├─ config.py        ← Settings (DATABASE_URL, SECRET_KEY)
│  │  ├─ api/auth.py      ← /auth/register, /auth/login
│  │  ├─ core/
│  │  │  ├─ security.py   ← hash_password(), verify_password()
│  │  │  └─ jwt.py        ← create_access_token(), decode_token()
│  │  ├─ db/
│  │  │  ├─ base.py       ← SQLAlchemy declarative base
│  │  │  └─ session.py    ← Database connection & get_db()
│  │  ├─ models/
│  │  │  ├─ user.py
│  │  │  └─ inbox_connection.py
│  │  └─ schemas/
│  │     ├─ user.py
│  │     ├─ inbox_connection.py
│  │     └─ token.py
│  ├─ alembic/            ← Database migrations
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ .env                ← Local only (not in git)
│
├─ frontend/
│  ├─ src/
│  │  ├─ main.tsx         ← React entry
│  │  ├─ App.tsx          ← Router & routes
│  │  ├─ pages/
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  └─ DashboardPage.tsx
│  │  ├─ services/
│  │  │  └─ api.ts        ← Axios client & authService
│  │  └─ index.css        ← Tailwind imports
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
│  ├─ package.json
│  ├─ .env.example
│  └─ .env                ← Local only (not in git)
│
├─ .gitignore
├─ README.md
├─ SETUP_GUIDE.md
└─ WEEK1_CHECKLIST.md
```

---

## Key Endpoints

### Authentication
```
POST   /auth/register    - Create new user
POST   /auth/login       - Get JWT token
GET    /                 - API health check
```

### Protected Routes
All protected routes require `Authorization: Bearer <token>` header

---

## Development Commands

### Backend
```bash
# Run server
uvicorn app.main:app --reload

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Frontend
```bash
# Dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## Database Credentials

```
Host: localhost
Port: 5432
User: admin
Password: admin
Database: email_warmup
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Backend won't start | Activate venv: `venv\Scripts\activate` |
| DB connection failed | Ensure Docker is running: `docker ps` |
| Frontend can't reach backend | Check `.env`: `VITE_API_URL=http://localhost:8000` |
| Port already in use | Stop process: `lsof -i :8000` or `netstat -ano` |
| Migration error | Rollback: `alembic downgrade base` then `alembic upgrade head` |

---

## Tech Stack Summary

| Layer | Tech |
|-------|------|
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 13+ |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Auth | JWT (python-jose) |
| Passwords | bcrypt |
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| UI Framework | Tailwind CSS |
| HTTP Client | Axios |
| Routing | React Router v6 |

---

## File Tree (Important Files Only)

```
.
├── .gitignore
├── README.md
├── SETUP_GUIDE.md
├── WEEK1_CHECKLIST.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── ...
│   └── venv/
├── frontend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── ...
│   └── node_modules/
└── docs/
    └── roadmap.md
```

---

## Next Steps After Week 1

1. **Setup Gmail OAuth** - Connect Google accounts
2. **Add Warm-up Models** - Campaign & email validation
3. **Build Admin Dashboard** - Manage campaigns
4. **Implement Email Sending** - Via SMTP/Gmail API
5. **Add Analytics** - Track deliverability metrics

---

**Last Updated**: Week 1 Complete ✅
