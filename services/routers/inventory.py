from __future__ import annotations

from collections.abc import Sequence
from hashlib import sha256
from hmac import new as hmac_new
from json import dumps
from secrets import token_bytes

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlmodel import Session, select

from services.cache import TTLCache
from services.database import get_db
from services.models import MedicalSupply, SupplyConsumption, SupplyDelivery
from services.schemas import (
    InboundOrderResponse,
    MedicalSupplyCreate,
    MedicalSupplyResponse,
    OutboundOrderResponse,
    SupplyConsumptionCreate,
    SupplyConsumptionResponse,
    SupplyDeliveryCreate,
    SupplyDeliveryResponse,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])
_products_cache = TTLCache[list[MedicalSupplyResponse]]()
_orders_cache = TTLCache[list[InboundOrderResponse | OutboundOrderResponse]]()
_scope_secret = token_bytes(32)


def _cache_scope(request: Request) -> str | None:
    authorization = request.headers.get("authorization", "").strip()
    if not authorization:
        return None
    credentials = [
        authorization,
        request.headers.get("cookie", ""),
    ]
    return hmac_new(_scope_secret, dumps(credentials).encode(), sha256).hexdigest()


def _bypass_cache(request: Request) -> bool:
    return request.headers.get("x-inventory-refresh", "").lower() == "true"


def _invalidate_inventory_cache() -> None:
    _products_cache.clear()
    _orders_cache.clear()


def _stock_totals(session: Session) -> tuple[dict[int, int], dict[int, int]]:
    delivery_rows = session.exec(
        select(SupplyDelivery.supply_id, func.sum(SupplyDelivery.quantity)).group_by(
            SupplyDelivery.supply_id
        )
    ).all()
    consumption_rows = session.exec(
        select(SupplyConsumption.supply_id, func.sum(SupplyConsumption.quantity)).group_by(
            SupplyConsumption.supply_id
        )
    ).all()
    deliveries = {supply_id: int(total) for supply_id, total in delivery_rows}
    consumptions = {supply_id: int(total) for supply_id, total in consumption_rows}
    return deliveries, consumptions


def _supply_response(
    supply: MedicalSupply,
    deliveries: dict[int, int],
    consumptions: dict[int, int],
) -> MedicalSupplyResponse:
    supply_id = supply.id
    current_stock = deliveries.get(supply_id, 0) - consumptions.get(supply_id, 0)
    return MedicalSupplyResponse(**supply.model_dump(), current_stock=current_stock)


def _get_supply_or_404(session: Session, supply_id: int) -> MedicalSupply:
    supply = session.get(MedicalSupply, supply_id)
    if supply is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
    return supply


def _current_stock(session: Session, supply_id: int) -> int:
    delivered = session.exec(
        select(func.coalesce(func.sum(SupplyDelivery.quantity), 0)).where(
            SupplyDelivery.supply_id == supply_id
        )
    ).one()
    consumed = session.exec(
        select(func.coalesce(func.sum(SupplyConsumption.quantity), 0)).where(
            SupplyConsumption.supply_id == supply_id
        )
    ).one()
    return int(delivered) - int(consumed)


@router.get("/products", response_model=list[MedicalSupplyResponse])
def list_products(
    request: Request, response: Response, session: Session = Depends(get_db)
) -> Sequence[MedicalSupplyResponse]:
    response.headers["Cache-Control"] = "no-store"

    def load_products() -> list[MedicalSupplyResponse]:
        deliveries, consumptions = _stock_totals(session)
        supplies = session.exec(select(MedicalSupply).order_by(MedicalSupply.name)).all()
        return [
            _supply_response(supply, deliveries, consumptions)
            for supply in supplies
        ]

    if _bypass_cache(request):
        return load_products()
    key = (session.get_bind(), _cache_scope(request))
    return _products_cache.get_or_load(key, 15, load_products)


@router.post(
    "/products",
    response_model=MedicalSupplyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    payload: MedicalSupplyCreate,
    session: Session = Depends(get_db),
) -> MedicalSupplyResponse:
    supply = MedicalSupply.model_validate(payload)
    session.add(supply)
    session.commit()
    _invalidate_inventory_cache()
    session.refresh(supply)
    return _supply_response(supply, {}, {})


@router.get("/products/{supply_id}", response_model=MedicalSupplyResponse)
def get_product(
    supply_id: int,
    session: Session = Depends(get_db),
) -> MedicalSupplyResponse:
    supply = _get_supply_or_404(session, supply_id)
    deliveries, consumptions = _stock_totals(session)
    return _supply_response(supply, deliveries, consumptions)


@router.post(
    "/deliveries",
    response_model=SupplyDeliveryResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_delivery(
    payload: SupplyDeliveryCreate,
    session: Session = Depends(get_db),
) -> SupplyDelivery:
    _get_supply_or_404(session, payload.supply_id)
    delivery = SupplyDelivery.model_validate(payload)
    session.add(delivery)
    session.commit()
    _invalidate_inventory_cache()
    session.refresh(delivery)
    return delivery


@router.post(
    "/consumptions",
    response_model=SupplyConsumptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_consumption(
    payload: SupplyConsumptionCreate,
    session: Session = Depends(get_db),
) -> SupplyConsumption:
    _get_supply_or_404(session, payload.supply_id)
    if payload.quantity > _current_stock(session, payload.supply_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad solicitada supera el stock disponible.",
        )

    consumption = SupplyConsumption.model_validate(payload)
    session.add(consumption)
    session.commit()
    _invalidate_inventory_cache()
    session.refresh(consumption)
    return consumption


@router.get("/orders", response_model=list[InboundOrderResponse | OutboundOrderResponse])
def list_orders(
    request: Request, response: Response, session: Session = Depends(get_db),
) -> Sequence[InboundOrderResponse | OutboundOrderResponse]:
    response.headers["Cache-Control"] = "no-store"

    def load_orders() -> list[InboundOrderResponse | OutboundOrderResponse]:
        deliveries = session.exec(
            select(SupplyDelivery, MedicalSupply.name).join(MedicalSupply)
        ).all()
        consumptions = session.exec(
            select(SupplyConsumption, MedicalSupply.name).join(MedicalSupply)
        ).all()
        orders = [
            InboundOrderResponse(**delivery.model_dump(), product_name=name)
            for delivery, name in deliveries
        ] + [
            OutboundOrderResponse(**consumption.model_dump(), product_name=name)
            for consumption, name in consumptions
        ]
        return sorted(orders, key=lambda order: order.created_at, reverse=True)

    scope = _cache_scope(request)
    if scope is None or _bypass_cache(request):
        return load_orders()
    return _orders_cache.get_or_load((session.get_bind(), scope), 30, load_orders)