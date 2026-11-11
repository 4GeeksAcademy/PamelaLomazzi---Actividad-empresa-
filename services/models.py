from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel


class Candidate(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: str | None = None
    cv_url: str | None = None
    experience_years: int = 0
    status: str = "received"
    stage: str = "pending"
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CandidateNote(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    record_id: str = Field(foreign_key="candidate.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MedicalSupply(SQLModel, table=True):
    __tablename__ = "medical_supply"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    sku: str
    category: str
    unit: str
    country: str


class SupplyDelivery(SQLModel, table=True):
    __tablename__ = "supply_delivery"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_supply_delivery_quantity_positive"),
        CheckConstraint("clinic_id BETWEEN 1 AND 12", name="ck_supply_delivery_clinic_range"),
    )

    id: int | None = Field(default=None, primary_key=True)
    supply_id: int = Field(foreign_key="medical_supply.id", index=True)
    quantity: int
    vendor_name: str
    clinic_id: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str


class SupplyConsumption(SQLModel, table=True):
    __tablename__ = "supply_consumption"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_supply_consumption_quantity_positive"),
        CheckConstraint("clinic_id BETWEEN 1 AND 12", name="ck_supply_consumption_clinic_range"),
        CheckConstraint(
            "consumption_type IN ('clinical_use', 'expiry_waste')",
            name="ck_supply_consumption_type",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    supply_id: int = Field(foreign_key="medical_supply.id", index=True)
    quantity: int
    consumption_type: str
    clinic_id: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str