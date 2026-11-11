from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from sqlmodel import SQLModel


class RootResponse(BaseModel):
    status: Literal["ok"]
    message: str


class HealthResponse(BaseModel):
    status: Literal["ok"]


class CandidateCreate(BaseModel):
    full_name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    position: str = Field(min_length=1)
    linkedin_url: HttpUrl | None = None
    cv_url: HttpUrl | None = None
    experience_years: int = Field(ge=0)


class CandidatePatch(BaseModel):
    status: Literal["received", "in_progress", "selected", "discarded"] | None = None
    stage: Literal[
        "pending", "review", "personal_interview", "technical_interview", "offer_presented"
    ] | None = None


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, pattern=r"\S")


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    record_id: str
    content: str
    created_at: datetime


class NotesMeta(BaseModel):
    total: int = Field(ge=0)


class NotesResponse(BaseModel):
    data: list[NoteResponse]
    meta: NotesMeta


class CandidateResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: HttpUrl | None
    cv_url: HttpUrl | None
    experience_years: int = Field(ge=0)
    status: Literal["received", "in_progress", "selected", "discarded"]
    stage: Literal[
        "pending", "review", "personal_interview", "technical_interview", "offer_presented"
    ]
    applied_at: datetime
    updated_at: datetime
    notes_count: int = Field(ge=0)


class RecordsResponse(BaseModel):
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    limit: int = Field(ge=1)
    data: list[CandidateResponse]


class MedicalSupplyCreate(SQLModel):
    name: str
    sku: str
    category: str
    unit: str
    country: str


class MedicalSupplyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    category: str
    unit: str
    country: str
    current_stock: int


class SupplyDeliveryCreate(SQLModel):
    supply_id: int
    quantity: int = Field(gt=0)
    vendor_name: str
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str


class SupplyDeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supply_id: int
    quantity: int = Field(gt=0)
    vendor_name: str
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str
    created_at: datetime


class SupplyConsumptionCreate(SQLModel):
    supply_id: int
    quantity: int = Field(gt=0)
    consumption_type: Literal["clinical_use", "expiry_waste"]
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str


class SupplyConsumptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supply_id: int
    quantity: int = Field(gt=0)
    consumption_type: Literal["clinical_use", "expiry_waste"]
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str
    created_at: datetime


class InboundOrderResponse(SupplyDeliveryResponse):
    order_type: Literal["inbound"] = "inbound"
    product_name: str


class OutboundOrderResponse(SupplyConsumptionResponse):
    order_type: Literal["outbound"] = "outbound"
    product_name: str