"""Seeder para el Directorio de Proveedores.

Carga proveedores iniciales en TinyDB de forma idempotente (no duplica
registros ya existentes, identificados por su `name`).

Uso:
    uv run seed
    python -m services.api.seed
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from tinydb import Query

from services.api.db import DB_PATH, get_suppliers_table
from services.api.models import ComplianceAgreement, Country, Currency, Supplier, SupplierStatus

# NOTA: CONTEXT.md no define proveedores concretos; estos datos iniciales
# son un ejemplo razonable acorde a las operaciones de HealthCore (EE. UU./Reino Unido).
INITIAL_SUPPLIERS: list[Supplier] = [
    Supplier(
        name="MedLine Supplies US",
        country=Country.USA,
        categories=["suministros_medicos", "equipamiento_clinico"],
        monthly_rate=1250.0,
        currency=Currency.USD,
        status=SupplierStatus.ACTIVE,
        compliance_agreement=ComplianceAgreement.BAA,
    ),
    Supplier(
        name="Athena Pharma UK",
        country=Country.UK,
        categories=["farmaceutica"],
        monthly_rate=980.5,
        currency=Currency.GBP,
        status=SupplierStatus.ACTIVE,
        compliance_agreement=ComplianceAgreement.DPA,
    ),
    Supplier(
        name="ClearTech Health Systems",
        country=Country.USA,
        categories=["tecnologia"],
        monthly_rate=3400.0,
        currency=Currency.USD,
        status=SupplierStatus.ACTIVE,
        compliance_agreement=ComplianceAgreement.BAA,
    ),
    Supplier(
        name="BrightClean Facilities Ltd",
        country=Country.UK,
        categories=["limpieza_y_mantenimiento"],
        monthly_rate=620.0,
        currency=Currency.GBP,
        status=SupplierStatus.SUSPENDED,
    ),
    Supplier(
        name="Austin Clinical Consulting",
        country=Country.USA,
        categories=["servicios_profesionales"],
        monthly_rate=1500.0,
        currency=Currency.USD,
        status=SupplierStatus.ACTIVE,
        compliance_agreement=ComplianceAgreement.BOTH,
    ),
]


def seed(db_path: Path = DB_PATH) -> int:
    """Inserta proveedores iniciales si no existen. Devuelve la cantidad insertada."""
    table = get_suppliers_table(db_path)
    SupplierQuery = Query()
    inserted = 0
    for supplier in INITIAL_SUPPLIERS:
        if table.contains(SupplierQuery.name == supplier.name):
            continue
        payload = supplier.model_dump(mode="json")
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        table.insert(payload)
        inserted += 1
    return inserted


def main() -> None:
    inserted = seed()
    print(f"Proveedores insertados: {inserted}")


if __name__ == "__main__":
    main()
