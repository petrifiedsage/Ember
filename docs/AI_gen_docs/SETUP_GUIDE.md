# Week 1 Setup Guide 🚀

This guide walks you through starting the **Email Warmup Platform** locally.

## Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL 13+ (or Docker)
- Git

## Step 1: Start PostgreSQL Database

### Option A: Docker (Recommended)

```bash
docker run --name warmup-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=email_warmup \
  -p 5433:5432 \
  -d postgres
```

### Option B: Local PostgreSQL

Ensure PostgreSQL is running on `localhost:5432` with credentials:
- User: `admin`
- Password: `admin`
- Database: `email_warmup`

## Step 2: Start Backend Server

```bash
cd backend

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload
```

✅ Backend ready at: **http://localhost:8000**

### Verify Backend is Working

```bash
curl http://localhost:8000/
# Should return: {"message": "Email Warmup API running 🚀"}
```

## Step 3: Start Frontend Server

In a new terminal:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

✅ Frontend ready at: **http://localhost:5173**

## Step 4: Test the Full Stack

### 1. Open Frontend

Navigate to: http://localhost:5173

### 2. Register a New Account

- Click "Sign up"
- Enter: Name, Email, Password
- Click "Sign up" button

### 3. Login

- Enter your email and password
- Click "Sign in"

### 4. View Dashboard

- You should see the dashboard with:
  - Welcome message
  - API Status (showing "Email Warmup API running 🚀")
  - Placeholder cards for future features

## API Endpoints (Week 1)

### Authentication

```bash
# Register
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}

# Login
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

# Returns:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Health Check

```bash
# API Status
GET http://localhost:8000/
```

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email (login)
- `password_hash` - Bcrypt hashed password
- `is_active` - Account status
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Inbox Connections Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `provider` - Email provider (gmail/outlook/smtp)
- `email` - Email address connected
- `access_token` - OAuth token (if applicable)
- `refresh_token` - OAuth refresh token (if applicable)
- `is_active` - Connection status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**: Make sure you're in the `backend/` directory and virtual environment is activated.

**Error**: `FATAL: password authentication failed`

**Solution**: Verify PostgreSQL is running and credentials match (admin:admin).

### Frontend Won't Connect to Backend

**Error**: `CORS error` or `Failed to fetch`

**Solution**: 
- Ensure backend is running on http://localhost:8000
- Check `.env` file: `VITE_API_URL=http://localhost:8000`

### Database Migrations Failed

**Error**: `Can't connect to database`

**Solution**:
```bash
# Check Alembic config
alembic current          # Check current version
alembic history          # See migration history
alembic upgrade head    # Re-run migrations
```

## Environment Files

### Backend `.env`
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/email_warmup
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000
```

## Next Steps (Week 2)

- Implement Gmail OAuth integration
- Add email validation and warm-up campaign models
- Create inbox connection endpoints
- Build campaign management UI

## Git Workflow

```bash
# Commit Week 1 completion
git add .
git commit -m "Week 1: Complete backend + frontend boilerplate with auth"
git push origin main
```

---

**Happy coding! 🚀**
