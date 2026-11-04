from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel


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