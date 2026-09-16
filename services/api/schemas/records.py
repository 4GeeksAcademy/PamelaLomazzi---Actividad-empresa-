from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

CandidateStatus = Literal["received", "in_progress", "selected", "discarded"]
CandidateStage = Literal[
    "pending", "review", "personal_interview", "technical_interview", "offer_presented"
]


class Note(BaseModel):
    id: str
    record_id: str
    content: str
    created_at: datetime


class NotePayload(BaseModel):
    content: str = Field(..., min_length=1)


class NotesResponseMeta(BaseModel):
    total: int


class NotesResponse(BaseModel):
    data: List[Note]
    meta: NotesResponseMeta


class RecordPayload(BaseModel):
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: Optional[str] = None
    cv_url: Optional[str] = None
    experience_years: int


class RecordPatchPayload(BaseModel):
    status: Optional[CandidateStatus] = None
    stage: Optional[CandidateStage] = None


class Record(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: Optional[str] = None
    cv_url: Optional[str] = None
    experience_years: int
    status: CandidateStatus
    stage: CandidateStage
    applied_at: datetime
    updated_at: datetime
    notes_count: int
    notes: Optional[List[Note]] = None


class RecordsResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Record]
