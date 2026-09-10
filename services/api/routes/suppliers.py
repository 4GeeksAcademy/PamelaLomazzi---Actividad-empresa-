"""Rutas del Directorio de Proveedores."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from tinydb.table import Document

from services.api.db import get_suppliers_table
from services.api.models import (
    Country,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierResponse,
    SupplierStatusUpdate,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _to_response(document: Document) -> SupplierResponse:
    return SupplierResponse(id=document.doc_id, **document)


def _get_document_or_404(supplier_id: int) -> Document:
    table = get_suppliers_table()
    document = table.get(doc_id=supplier_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con id {supplier_id} no encontrado",
        )
    return document


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate) -> SupplierResponse:
    table = get_suppliers_table()
    record = payload.model_dump(mode="json")
    record["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc_id = table.insert(record)
    return _to_response(table.get(doc_id=doc_id))


@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    country: Optional[Country] = Query(default=None, description="Filtra por país"),
    category: Optional[str] = Query(default=None, description="Filtra por categoría"),
) -> List[SupplierResponse]:
    table = get_suppliers_table()
    documents = table.all()

    if country is not None:
        documents = [doc for doc in documents if doc.get("country") == country.value]
    if category is not None:
        documents = [doc for doc in documents if category in doc.get("categories", [])]

    return [_to_response(doc) for doc in documents]


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int) -> SupplierResponse:
    document = _get_document_or_404(supplier_id)
    return _to_response(document)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate) -> SupplierResponse:
    _get_document_or_404(supplier_id)
    table = get_suppliers_table()
    table.update(
        {
            "monthly_rate": payload.monthly_rate,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        doc_ids=[supplier_id],
    )
    return _to_response(table.get(doc_id=supplier_id))


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate) -> SupplierResponse:
    _get_document_or_404(supplier_id)
    table = get_suppliers_table()
    table.update(
        {
            "status": payload.status.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        doc_ids=[supplier_id],
    )
    return _to_response(table.get(doc_id=supplier_id))


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int) -> None:
    _get_document_or_404(supplier_id)
    table = get_suppliers_table()
    table.remove(doc_ids=[supplier_id])
