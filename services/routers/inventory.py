from __future__ import annotations

from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

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
def list_products(session: Session = Depends(get_db)) -> Sequence[MedicalSupplyResponse]:
    deliveries, consumptions = _stock_totals(session)
    supplies = session.exec(select(MedicalSupply).order_by(MedicalSupply.name)).all()
    return [
        _supply_response(supply, deliveries, consumptions)
        for supply in supplies
    ]


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
    session.refresh(consumption)
    return consumption


@router.get("/orders", response_model=list[InboundOrderResponse | OutboundOrderResponse])
def list_orders(
    session: Session = Depends(get_db),
) -> Sequence[InboundOrderResponse | OutboundOrderResponse]:
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