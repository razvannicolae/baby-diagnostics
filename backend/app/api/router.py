from fastapi import APIRouter

from app.api.routes import analysis, auth, babies, health, scans, users

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(babies.router, tags=["babies"])
api_router.include_router(scans.router, tags=["scans"])
api_router.include_router(analysis.router, tags=["analysis"])
