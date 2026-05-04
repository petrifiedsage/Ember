from fastapi import APIRouter
from app.api.v1 import auth, domains, dns

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
api_router.include_router(dns.router, prefix="/dns", tags=["dns"])
