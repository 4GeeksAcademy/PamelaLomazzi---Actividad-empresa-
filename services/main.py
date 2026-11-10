from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.api_v1 import api_router
from services.database import init_db
from services.routers.inventory import router as inventory_router
from services.schemas import HealthResponse, RecordsResponse, RootResponse


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


@app.get("/", tags=["health"], response_model=RootResponse)
def root() -> RootResponse:
    return RootResponse(status="ok", message="HealthCore API v1")


@app.get("/health", tags=["health"], response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/records", tags=["candidates"], response_model=RecordsResponse)
def get_records() -> RecordsResponse:
    records = [
        {
            "id": "candidate-demo-001",
            "full_name": "Lucia Fernandez",
            "email": "lucia.fernandez@example.com",
            "phone": "+34 600 123 001",
            "position": "Medica de familia",
            "linkedin_url": None,
            "cv_url": None,
            "experience_years": 6,
            "status": "in_progress",
            "stage": "review",
            "applied_at": "2026-10-28T09:30:00Z",
            "updated_at": "2026-11-03T14:15:00Z",
            "notes_count": 1,
        },
        {
            "id": "candidate-demo-002",
            "full_name": "Mateo Ruiz",
            "email": "mateo.ruiz@example.com",
            "phone": "+34 600 123 002",
            "position": "Enfermero de urgencias",
            "linkedin_url": None,
            "cv_url": None,
            "experience_years": 4,
            "status": "received",
            "stage": "pending",
            "applied_at": "2026-11-02T11:00:00Z",
            "updated_at": "2026-11-02T11:00:00Z",
            "notes_count": 0,
        },
        {
            "id": "candidate-demo-003",
            "full_name": "Sara Martin",
            "email": "sara.martin@example.com",
            "phone": "+34 600 123 003",
            "position": "Tecnica de laboratorio",
            "linkedin_url": None,
            "cv_url": None,
            "experience_years": 3,
            "status": "selected",
            "stage": "offer_presented",
            "applied_at": "2026-10-18T08:45:00Z",
            "updated_at": "2026-11-05T16:20:00Z",
            "notes_count": 2,
        },
        {
            "id": "candidate-demo-004",
            "full_name": "Daniel Ortega",
            "email": "daniel.ortega@example.com",
            "phone": "+34 600 123 004",
            "position": "Administrativo de clinica",
            "linkedin_url": None,
            "cv_url": None,
            "experience_years": 8,
            "status": "discarded",
            "stage": "personal_interview",
            "applied_at": "2026-10-12T13:10:00Z",
            "updated_at": "2026-10-25T10:00:00Z",
            "notes_count": 1,
        },
    ]
    return RecordsResponse(total=len(records), page=1, limit=len(records), data=records)