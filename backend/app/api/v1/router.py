from fastapi import APIRouter
from app.api.v1 import auth, domains, dns, blacklists, metrics, alerts, seed_tests

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
api_router.include_router(dns.router, prefix="/dns", tags=["dns"])
api_router.include_router(blacklists.router, prefix="/blacklists", tags=["blacklists"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(seed_tests.router, prefix="/seed-tests", tags=["seed_tests"])
