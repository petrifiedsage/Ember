# Email Warmup Platform 🚀

A comprehensive email warmup automation system designed to help improve email deliverability through intelligent warm-up campaigns.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React (TypeScript), Vite, Tailwind CSS
- **Authentication**: JWT with bcrypt
- **Database**: PostgreSQL with Alembic migrations
- **Task Queue**: Celery/RQ (upcoming)

## Project Structure

```
email-warmup/
├─ backend/          # FastAPI application
│  ├─ app/
│  │  ├─ main.py           # FastAPI entrypoint
│  │  ├─ config.py         # Configuration
│  │  ├─ db/               # Database setup
│  │  ├─ models/           # SQLAlchemy models
│  │  ├─ schemas/          # Pydantic schemas
│  │  ├─ api/              # API routes
│  │  └─ core/             # Core utilities (auth, security)
│  ├─ alembic/       # Database migrations
│  ├─ tests/         # Backend tests
│  ├─ requirements.txt
│  └─ venv/          # Virtual environment
│
└─ frontend/         # React application
   ├─ src/
   │  ├─ pages/
   │  ├─ components/
   │  ├─ services/
   │  └─ App.tsx
   ├─ package.json
   └─ node_modules/
```

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL 13+
- Docker (recommended for PostgreSQL)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start PostgreSQL (via Docker)
docker run --name warmup-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=email_warmup -p 5432:5432 -d postgres

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Health
- `GET /` - API status

## Development

### Week 1 Goals
- ✅ Backend + DB + migrations ready
- ✅ Frontend project created
- ✅ Architecture + DB schema finalized
- ✅ Repo structured nicely

## Contributing

This is a personal project. Please fork and submit PRs for any improvements!

## License

MIT
