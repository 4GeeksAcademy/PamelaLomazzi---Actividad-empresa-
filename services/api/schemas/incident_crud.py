from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

IncidentCategory = Literal[
    "ppe", "medications", "consumables", "equipment", "wound_care", "diagnostics"
]
IncidentOrigin = Literal["customer", "branch", "internal"]
IncidentStatus = Literal["open", "in_progress", "resolved", "discarded"]


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: str = Field(..., min_length=1, max_length=50)


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: datetime
    updated_at: datetime


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]
