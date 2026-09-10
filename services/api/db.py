"""Acceso compartido a la base TinyDB de proveedores."""
from __future__ import annotations

from pathlib import Path

from tinydb import TinyDB
from tinydb.table import Table

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "suppliers_db.json"


def get_suppliers_table(db_path: Path = DB_PATH) -> Table:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db = TinyDB(db_path)
    return db.table("suppliers")
