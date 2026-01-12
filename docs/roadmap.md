# Week 1 — Architecture + Environment + Project Boilerplate

## Overview
Week 1 focuses on building a solid foundation for the email warmup platform with backend infrastructure, database setup, and frontend scaffolding.

## Completed Tasks

### ✅ Day 1: Monorepo Setup + Git
- Created monorepo structure with `backend/` and `frontend/` folders
- Initialized Git repository
- Added comprehensive `.gitignore`
- Created `README.md` with project overview

### ✅ Day 2: Backend FastAPI Setup
- Created Python virtual environment
- Installed core dependencies:
  - FastAPI & Uvicorn (web framework)
  - SQLAlchemy (ORM)
  - python-dotenv (configuration)
  - passlib[bcrypt] (password hashing)
  - python-jose (JWT tokens)
- Established directory structure:
  ```
  backend/
  ├─ app/
  │  ├─ main.py           (FastAPI app)
  │  ├─ config.py         (settings)
  │  ├─ db/               (database setup)
  │  ├─ core/             (security, JWT)
  │  ├─ models/           (SQLAlchemy models)
  │  ├─ schemas/          (Pydantic schemas)
  │  └─ api/              (route handlers)
  └─ requirements.txt
  ```

### ✅ Day 3: PostgreSQL + Alembic Migrations
- Set up SQLAlchemy database session management
- Initialized Alembic for database migrations
- Configured `alembic.ini` with PostgreSQL connection
- Updated `alembic/env.py` to use SQLAlchemy models
- Ready for automated migration generation

### ✅ Day 4: Database Models
Created core models:
- **User** model with authentication fields
- **InboxConnection** model for email account tracking

All models include:
- Proper relationships and foreign keys
- Timestamps (created_at, updated_at)
- Indexing for performance

### ✅ Day 5: Authentication Endpoints
- **Password hashing**: bcrypt-based password management
- **JWT tokens**: Token generation and validation
- **API endpoints**:
  - `POST /auth/register` - Create new user account
  - `POST /auth/login` - Authenticate and receive JWT token
- Proper error handling and validation

### ✅ Day 6: Frontend React Boilerplate
- Set up React 18 + TypeScript + Vite
- Tailwind CSS for styling
- Configured routing with React Router
- Created essential pages:
  - **LoginPage** - User authentication
  - **RegisterPage** - New user registration
  - **DashboardPage** - Main application dashboard
- API integration layer with Axios
- Token-based authentication flow

### ✅ Day 7: Documentation & Ready for Deployment
- Comprehensive README with setup instructions
- Environment configuration examples (.env.example)
- Project roadmap documentation
- Git repository structured and ready

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Password Hashing | Bcrypt |
| Authentication | JWT (python-jose) |
| Frontend Framework | React 18 |
| Frontend Build Tool | Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Routing | React Router DOM |
| Language | TypeScript |

## Database Schema (Current)

### Users Table
```
id (PK)
name
email (UNIQUE)
password_hash
is_active
created_at
updated_at
```

### Inbox Connections Table
```
id (PK)
user_id (FK)
provider (gmail, outlook, smtp, imap)
email
access_token
refresh_token
is_active
created_at
updated_at
```

## How to Start the Application

### Backend
```bash
cd backend
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
API available at: `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App available at: `http://localhost:5173`

### Database (Docker)
```bash
docker run --name warmup-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=email_warmup \
  -p 5432:5432 \
  -d postgres
```

### Run Migrations
```bash
cd backend
alembic upgrade head
```

## Next Steps (Week 2)

- [ ] Gmail OAuth integration
- [ ] Warm-up campaign models
- [ ] Email sending infrastructure
- [ ] Analytics and metrics tracking
- [ ] Advanced user management

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

## Project Status

✅ **Week 1 Complete!** All foundational components are in place and working.
