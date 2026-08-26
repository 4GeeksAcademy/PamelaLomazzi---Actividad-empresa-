from __future__ import annotations

import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.api_v1 import api_router
from services.api.dependencies.auth import get_current_user
from services.api.models.auth import User
from services.api.routers.auth import router as auth_router
from services.api.routers.profiles import router as profiles_router
from services.api.routers.users import router as users_router


def _get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]


def _get_cors_origin_regex() -> str:
    raw = os.getenv("CORS_ALLOW_ORIGIN_REGEX", "")
    if raw.strip():
        return raw.strip()

    # Permite frontends en puertos dinamicos de localhost y Codespaces/Preview.
    return (
        r"^(https://.*-\d+\.(app\.github\.dev|githubpreview\.dev)"
        r"|http://(localhost|127\.0\.0\.1):\d+)$"
    )


app = FastAPI(title="HealthCore Incidents API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=_get_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)


@app.get("/health", tags=["health"])
def health_check(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    del current_user
    return {"status": "ok"}
