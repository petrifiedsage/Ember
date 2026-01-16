# Developer Onboarding Checklist ✅

Use this checklist when a new developer joins the team to ensure they have everything set up correctly.

---

## Pre-Setup (Before Starting)

- [ ] Cloned the repository locally
- [ ] Git configured with name and email
- [ ] Docker installed (if using Docker for PostgreSQL)
- [ ] Python 3.10+ installed
- [ ] Node.js 16+ installed
- [ ] VS Code or preferred IDE installed

---

## Backend Setup

### Environment

- [ ] Navigate to `backend/` directory
- [ ] Created virtual environment:
  ```bash
  python -m venv venv
  ```
- [ ] Activated virtual environment:
  ```bash
  # Windows
  venv\Scripts\activate
  # macOS/Linux
  source venv/bin/activate
  ```
- [ ] Installed dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Created `.env` file (copy from `.env.example`)

### Database

- [ ] Started PostgreSQL (Docker or local)
- [ ] Verified database connection:
  ```bash
  psql -U admin -d email_warmup -c "SELECT 1"
  ```
- [ ] Ran migrations:
  ```bash
  alembic upgrade head
  ```
- [ ] Verified migrations in database:
  ```bash
  alembic current
  ```

### Server

- [ ] Started FastAPI server:
  ```bash
  uvicorn app.main:app --reload
  ```
- [ ] Tested health endpoint:
  ```bash
  curl http://localhost:8000/
  ```
- [ ] Reviewed FastAPI auto-docs:
  ```
  http://localhost:8000/docs
  ```

### Code Review

- [ ] Read `app/main.py` - Understand FastAPI setup
- [ ] Read `app/config.py` - Understand configuration
- [ ] Read `app/api/auth.py` - Understand auth endpoints
- [ ] Read `app/models/user.py` - Understand database models
- [ ] Reviewed `app/core/security.py` - Understand auth security

---

## Frontend Setup

### Environment

- [ ] Navigate to `frontend/` directory
- [ ] Installed dependencies:
  ```bash
  npm install
  ```
- [ ] Created `.env` file (copy from `.env.example`)
- [ ] Verified Node modules installed:
  ```bash
  npm list react react-router-dom axios
  ```

### Development Server

- [ ] Started dev server:
  ```bash
  npm run dev
  ```
- [ ] Opened browser to http://localhost:5173
- [ ] Verified Tailwind CSS is loading (check styling)
- [ ] Verified no console errors

### Code Review

- [ ] Read `src/App.tsx` - Understand routing
- [ ] Read `src/pages/LoginPage.tsx` - Understand form submission
- [ ] Read `src/services/api.ts` - Understand API integration
- [ ] Reviewed `tailwind.config.js` - Understand Tailwind setup

---

## Integration Testing

### Authentication Flow

- [ ] Registered new user at http://localhost:5173/register
  - [ ] Entered valid name, email, password
  - [ ] Successfully created account
  - [ ] Redirected to login page

- [ ] Logged in at http://localhost:5173/login
  - [ ] Entered correct credentials
  - [ ] Received JWT token
  - [ ] Token stored in localStorage
  - [ ] Redirected to dashboard

- [ ] Accessed protected route
  - [ ] Dashboard loaded at http://localhost:5173/dashboard
  - [ ] Shows API status: "Email Warmup API running 🚀"
  - [ ] Logout button works
  - [ ] Redirects to login after logout

### Error Handling

- [ ] Tried registering with existing email
  - [ ] Error displayed: "Email already registered"
  
- [ ] Tried logging in with wrong password
  - [ ] Error displayed: "Invalid email or password"

- [ ] Tried accessing dashboard without login
  - [ ] Redirected to login page

- [ ] Network error handling
  - [ ] Stop backend, try to login
  - [ ] Error message displayed gracefully

---

## Development Workflow

### Making Changes

- [ ] Created feature branch:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- [ ] Made code changes
- [ ] Tested changes locally
- [ ] Committed with clear message:
  ```bash
  git commit -m "feat: add new feature"
  ```

### Backend Development

- [ ] Understand file structure in `app/`:
  - [ ] `api/` - Route handlers
  - [ ] `models/` - Database models
  - [ ] `schemas/` - Data validation
  - [ ] `core/` - Utilities (auth, security)
  - [ ] `db/` - Database setup

- [ ] Added new endpoint:
  - [ ] Added route in `api/`
  - [ ] Created schema in `schemas/`
  - [ ] Tested with curl or Postman
  - [ ] Checked auto-docs at `/docs`

- [ ] Added database migration:
  - [ ] Created migration:
    ```bash
    alembic revision --autogenerate -m "description"
    ```
  - [ ] Applied migration:
    ```bash
    alembic upgrade head
    ```
  - [ ] Verified in database

### Frontend Development

- [ ] Understand file structure in `src/`:
  - [ ] `pages/` - Page components
  - [ ] `services/` - API calls
  - [ ] `components/` - Reusable components (future)

- [ ] Added new page:
  - [ ] Created component in `pages/`
  - [ ] Added route in `App.tsx`
  - [ ] Tested navigation

- [ ] Made API call:
  - [ ] Used `api.post()` or similar
  - [ ] Handled loading state
  - [ ] Handled error state
  - [ ] Tested with backend

---

## Important Commands

### Backend

```bash
# Activate environment
source venv/bin/activate

# Run server
uvicorn app.main:app --reload

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current migration
alembic current

# View migration history
alembic history
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

### Database

```bash
# Connect to database
psql -U admin -d email_warmup

# List tables
\dt

# Describe table
\d users

# Exit
\q
```

---

## IDE Setup

### VS Code Extensions (Recommended)

- [ ] Python
- [ ] Pylance
- [ ] SQLTools
- [ ] Tailwind CSS IntelliSense
- [ ] ES7+ React/Redux/React-Native snippets

### Settings (Optional)

Create `.vscode/settings.json`:
```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "[python]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "ms-python.python"
  },
  "[typescript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Documentation to Read

- [ ] `README.md` - Project overview
- [ ] `SETUP_GUIDE.md` - Setup walkthrough
- [ ] `QUICKSTART.md` - Quick reference
- [ ] `WEEK1_CHECKLIST.md` - Week 1 tasks
- [ ] `docs/roadmap.md` - Roadmap for future weeks
- [ ] `IMPLEMENTATION_REPORT.md` - Technical details

---

## Common Issues

### Backend Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'app'` | Ensure in `backend/` directory, venv activated |
| `FATAL: password authentication failed` | Check DB credentials in `.env` |
| `Address already in use` | Port 8000 in use, stop other process or change port |
| `ImportError` | Run `pip install -r requirements.txt` again |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| `npm ERR! 404` | Run `npm install` again |
| `Tailwind not loading` | Check `src/index.css` has `@tailwind` imports |
| `API not connecting` | Verify backend running, check `.env` VITE_API_URL |

### Database Issues

| Issue | Solution |
|-------|----------|
| `Can't connect to database` | Verify PostgreSQL running, check credentials |
| `Migration failed` | Run `alembic current` to check status, rollback if needed |

---

## Getting Help

1. Check `SETUP_GUIDE.md` troubleshooting section
2. Review code comments in relevant files
3. Check FastAPI docs at http://localhost:8000/docs
4. Review test files (if any)
5. Ask team lead or create issue

---

## Sign-Off

Once all items above are checked:

- [ ] Everything is working locally
- [ ] Can register and login
- [ ] Can run backend and frontend
- [ ] Understand project structure
- [ ] Understand development workflow

**You're ready to develop! 🚀**

---

**Last Updated**: Week 1 Complete  
**Version**: 1.0
