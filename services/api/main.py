from __future__ import annotations

import os

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from services.api.api_v1 import api_router
from services.api.models.incident import Base
from services.api.db import engine

logger = logging.getLogger(__name__)


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


@app.on_event("startup")
def create_database_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = [
        {
            "field": " -> ".join(
                str(location) for location in error.get("loc", ()) if location != "body"
            ),
            "message": error.get("msg", "Los datos enviados no son válidos."),
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": "Los datos enviados no son válidos.",
            "details": details,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "Error interno del servidor."},
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=_get_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
