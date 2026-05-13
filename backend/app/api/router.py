from fastapi import APIRouter
from app.api import auth, users, inboxes

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(inboxes.router, prefix="/inboxes", tags=["inboxes"])
