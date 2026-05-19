from contextlib import asynccontextmanager
from pathlib import Path
import logging
import subprocess
import sys

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.core.rate_limiter import limiter
from app.workers.scheduler import scheduler
from app.utils.logging import configure_logging, generate_request_id, request_id_context


configure_logging()
logger = logging.getLogger(__name__)


def _run_startup_migrations() -> None:
    project_root = Path(__file__).resolve().parents[1]
    logger.info("Running startup migrations")
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=project_root, check=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.run_migrations_on_startup:
        _run_startup_migrations()
    scheduler.start()
    yield
    scheduler.shutdown()

docs_enabled = settings.environment.lower() != "production"
app = FastAPI(
    title="Ember API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or generate_request_id()
    token = request_id_context.set(request_id)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        request_id_context.reset(token)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTPException %s %s -> %s", request.method, request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("ValidationError %s %s -> %s", request.method, request.url.path, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(RateLimitExceeded)
async def ratelimit_exception_handler(request: Request, exc: RateLimitExceeded):
    logger.warning("RateLimitExceeded %s %s", request.method, request.url.path)
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
