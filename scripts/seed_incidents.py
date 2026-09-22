#!/usr/bin/env python3
"""Import the historical incidents CSV into a SQLAlchemy database.

The CSV's incident_id is preserved as the primary key, making reruns safe:
existing rows are updated rather than duplicated.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from services.api.models.incident import Base, Incident

DEFAULT_CSV = Path(__file__).with_name("incidents-COMPANY.csv")
DEFAULT_DATABASE_URL = "sqlite:///healthcore.db"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, dest="csv_path")
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL),
        help="SQLAlchemy database URL (default: DATABASE_URL or sqlite:///healthcore.db)",
    )
    return parser.parse_args()


def normalize_branch(region: str | None) -> str:
    """Map legacy CSV region codes to the canonical branch namespace."""
    region = (region or "").strip().upper()
    return {
        "US-FL": "US-FL-MIAMI",
        "US-GA": "US-GA-ATLANTA",
        "US-TX": "US-TX-AUSTIN",
        "UK-LON": "UK-LON-CENTRAL",
        "UK-MAN": "UK-MAN-CENTRAL",
    }.get(region, "central")


def parse_created_at(value: str | None, record_id: str | None = None) -> datetime:
    value = (value or "").strip()
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)
    except ValueError as exc:
        record_label = record_id or "sin identificador"
        print(
            f"Error: fecha inválida para el registro '{record_label}': '{value}'.",
            file=sys.stderr,
        )
        raise ValueError(
            f"No se pudo interpretar reported_at para el registro '{record_label}'."
        ) from exc


def seed(csv_path: Path, database_url: str) -> tuple[int, int]:
    inserted = updated = 0

    try:
        engine = create_engine(database_url)
        Base.metadata.create_all(engine)

        with csv_path.open(newline="", encoding="utf-8-sig") as source, Session(engine) as session:
            try:
                for row in csv.DictReader(source):
                    incident_id = (row.get("incident_id") or "").strip()
                    if not incident_id:
                        continue

                    created_at = parse_created_at(row.get("reported_at"), incident_id)
                    values = {
                        "title": (row.get("summary") or incident_id).strip(),
                        "description": (row.get("summary") or "").strip(),
                        "category": (row.get("category") or "").strip(),
                        "status": (row.get("status") or "").strip(),
                        "origin": "customer",
                        "branch": normalize_branch(row.get("clinic_region")),
                        "created_at": created_at,
                        "updated_at": created_at,
                    }
                    incident = session.get(Incident, incident_id)
                    if incident is None:
                        session.add(Incident(id=incident_id, **values))
                        inserted += 1
                    else:
                        for field, value in values.items():
                            setattr(incident, field, value)
                        updated += 1
                session.commit()
            except Exception:
                session.rollback()
                raise
    except Exception as exc:
        raise RuntimeError(f"No se pudo completar la importación de incidencias: {exc}") from exc

    return inserted, updated


def main() -> None:
    args = parse_args()
    try:
        inserted, updated = seed(args.csv_path, args.database_url)
    except Exception as exc:
        print(f"Error durante el seed de incidencias: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    print(f"Seed completado: {inserted} insertadas, {updated} actualizadas.")


if __name__ == "__main__":
    main()
