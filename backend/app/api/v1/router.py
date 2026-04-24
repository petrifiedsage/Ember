from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.dns import router as dns_router
from app.api.v1.domains import router as domains_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(domains_router)
api_router.include_router(dns_router)
