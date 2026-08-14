from __future__ import annotations

from fastapi import APIRouter

from services.api.routers.incidents import router as incidents_router

api_router = APIRouter(prefix="/api")
api_router.include_router(incidents_router)
