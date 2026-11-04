from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.api_v1 import api_router
from services.database import init_db
from services.routers.inventory import router as inventory_router


def _get_cors_origin_regex() -> str:
    raw = os.getenv("CORS_ALLOW_ORIGIN_REGEX", "")
    if raw.strip():
        return raw.strip()

    return (
        r"^(https://.*-\d+\.(app\.github\.dev|githubpreview\.dev)"
        r"|http://(localhost|127\.0\.0\.1):\d+)$"
    )


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="HealthCore Incidents API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=_get_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.include_router(inventory_router)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"status": "ok", "message": "HealthCore API v1"}


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}