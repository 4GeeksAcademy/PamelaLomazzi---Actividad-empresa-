"""Modelos Pydantic para el Directorio de Proveedores.

Esquema alineado estrictamente con la documentación oficial de Supplier.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class Country(str, Enum):
    USA = "USA"
    UK = "UK"


class Currency(str, Enum):
    USD = "USD"
    GBP = "GBP"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class ComplianceAgreement(str, Enum):
    BAA = "BAA"
    DPA = "DPA"
    BOTH = "both"


_COUNTRY_CURRENCY_MAP = {
    Country.USA: Currency.USD,
    Country.UK: Currency.GBP,
}


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, description="Nombre comercial")
    country: Country = Field(..., description="País del proveedor: USA o UK")
    categories: List[str] = Field(..., min_length=1, description="Categorías del proveedor")
    monthly_rate: float = Field(..., gt=0, description="Tarifa mensual; debe ser estrictamente positiva")
    currency: Currency = Field(..., description="Moneda: USD para USA, GBP para UK")
    compliance_agreement: Optional[ComplianceAgreement] = Field(
        default=None, description="BAA, DPA, both o None"
    )
    contract_renewal_date: Optional[date] = Field(
        default=None, description="Fecha de renovación de contrato, formato YYYY-MM-DD"
    )
    contact_email: Optional[EmailStr] = Field(default=None, description="Correo de contacto")
    notes: Optional[str] = Field(default=None, description="Notas adicionales")

    @model_validator(mode="after")
    def _check_currency_matches_country(self) -> "SupplierBase":
        expected = _COUNTRY_CURRENCY_MAP[self.country]
        if self.currency != expected:
            raise ValueError(f"currency debe ser '{expected.value}' para country '{self.country.value}'")
        return self


class SupplierCreate(SupplierBase):
    status: SupplierStatus = Field(default=SupplierStatus.ACTIVE)


class SupplierRateUpdate(BaseModel):
    monthly_rate: float = Field(..., gt=0, description="Nueva tarifa mensual; debe ser estrictamente positiva")


class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus


class Supplier(SupplierBase):
    status: SupplierStatus = Field(default=SupplierStatus.ACTIVE)
    # updated_at es generado únicamente por el sistema, nunca por el cliente.
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SupplierResponse(SupplierBase):
    id: int = Field(..., description="ID del documento en TinyDB")
    status: SupplierStatus
    updated_at: datetime
