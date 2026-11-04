from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import ConfigDict, Field
from sqlmodel import SQLModel


class MedicalSupplyCreate(SQLModel):
    name: str
    sku: str
    category: str
    unit: str
    country: str


class MedicalSupplyResponse(MedicalSupplyCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_stock: int


class SupplyDeliveryCreate(SQLModel):
    supply_id: int
    quantity: int = Field(gt=0)
    vendor_name: str
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str


class SupplyDeliveryResponse(SupplyDeliveryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class SupplyConsumptionCreate(SQLModel):
    supply_id: int
    quantity: int = Field(gt=0)
    consumption_type: Literal["clinical_use", "expiry_waste"]
    clinic_id: int = Field(ge=1, le=12)
    user_uuid: str


class SupplyConsumptionResponse(SupplyConsumptionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime