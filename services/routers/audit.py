from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from services.database import get_db
from services.models import AuditEvent
from services.schemas import AuditActor, AuditEventRead
from services.security import get_audit_actor

router = APIRouter(prefix="/audit", tags=["audit"])


def _require_audit_viewer(
    actor: AuditActor = Depends(get_audit_actor),
) -> AuditActor:
    if actor.role == "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El rol employee no tiene acceso al visor general de auditoría.",
        )
    return actor


@router.get("/events", response_model=list[AuditEventRead])
def list_audit_events(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_db),
    actor: AuditActor = Depends(_require_audit_viewer),
) -> list[AuditEvent]:
    statement = select(AuditEvent)
    if actor.role == "supervisor":
        statement = statement.where(AuditEvent.department_id == actor.department_id)

    return list(
        session.exec(
            statement.order_by(AuditEvent.occurred_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )