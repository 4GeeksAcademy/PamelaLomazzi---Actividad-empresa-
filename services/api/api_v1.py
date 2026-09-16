from __future__ import annotations

from fastapi import APIRouter

from services.api.routers.auth import router as auth_router
from services.api.routers.incidents import router as incidents_router
from services.api.routers.profiles import router as profiles_router
from services.api.routers.users import router as users_router

api_router = APIRouter(prefix="/api")
api_router.include_router(incidents_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(profiles_router)
