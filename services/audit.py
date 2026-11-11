from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

from sqlalchemy import func
from sqlmodel import Session, select

from services.models import AuditEvent
from services.schemas import AuditActor, AuditEventCreate

logger = logging.getLogger(__name__)
BURST_WINDOW_SECONDS = 300
BURST_THRESHOLD = 10


def record_audit_event(
    session: Session,
    actor: AuditActor,
    event: AuditEventCreate,
    occurred_at: datetime | None = None,
    event_id: UUID | None = None,
) -> AuditEvent:
    event_time = occurred_at or datetime.now(timezone.utc)
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    cutoff = event_time - timedelta(seconds=BURST_WINDOW_SECONDS)
    recent_count = session.exec(
        select(func.count()).select_from(AuditEvent).where(
            AuditEvent.actor_id == actor.id,
            AuditEvent.occurred_at > cutoff,
            AuditEvent.occurred_at <= event_time,
        )
    ).one()
    access_count = recent_count + 1
    anomaly_detected = access_count >= BURST_THRESHOLD

    audit_event = AuditEvent(
        id=event_id or uuid4(),
        actor_id=actor.id,
        actor_role=actor.role,
        department_id=actor.department_id,
        patient_ref=event.patient_ref,
        action=event.action,
        occurred_at=event_time,
        anomaly_detected=anomaly_detected,
    )
    session.add(audit_event)
    session.commit()
    session.refresh(audit_event)

    if access_count == BURST_THRESHOLD:
        logger.warning(
            "audit_access_burst actor_id=%s event_count=%d window_seconds=%d",
            actor.id,
            access_count,
            BURST_WINDOW_SECONDS,
        )
    return audit_event


def seed_audit_events(session: Session) -> None:
    actors = [
        AuditActor(
            id=UUID("00000000-0000-4000-8000-000000000001"),
            role="admin",
            department_id="executive",
        ),
        AuditActor(
            id=UUID("00000000-0000-4000-8000-000000000002"),
            role="supervisor",
            department_id="clinical-ops",
        ),
        AuditActor(
            id=UUID("00000000-0000-4000-8000-000000000003"),
            role="employee",
            department_id="patient-access",
        ),
    ]
    actions = [
        "read", "read", "modify", "read", "export",
        "read", "modify", "read", "read", "modify",
        "export", "read", "modify", "read", "read",
    ]
    patient_refs = [
        uuid5(NAMESPACE_URL, f"healthcore-demo-patient-{index}")
        for index in range(1, 7)
    ]
    seed_time = datetime.now(timezone.utc) - timedelta(days=1)
    seed_event_ids = [
        uuid5(NAMESPACE_URL, f"healthcore-demo-audit-event-{index}")
        for index in range(len(actions))
    ]
    existing_seed_ids = set(
        session.exec(
            select(AuditEvent.id).where(AuditEvent.id.in_(seed_event_ids))
        ).all()
    )

    for index, action in enumerate(actions):
        if seed_event_ids[index] in existing_seed_ids:
            continue
        actor = actors[index % len(actors)]
        record_audit_event(
            session,
            actor,
            AuditEventCreate(
                patient_ref=patient_refs[index % len(patient_refs)],
                action=action,
            ),
            occurred_at=seed_time + timedelta(minutes=index * 20),
            event_id=seed_event_ids[index],
        )