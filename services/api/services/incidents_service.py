from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.models.incident import Incident
from services.api.schemas.incident_crud import IncidentCreate, IncidentStatus


class IncidentNotFoundError(Exception):
    pass


class InvalidIncidentTransitionError(Exception):
    pass


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}


class IncidentsService:
    def __init__(self, session: Session):
        self.session = session

    def create(self, payload: IncidentCreate) -> Incident:
        now = datetime.now(timezone.utc)
        incident = Incident(
            id=str(uuid4()),
            title=payload.title,
            description=payload.description,
            category=payload.category,
            status="open",
            origin=payload.origin,
            branch=payload.branch,
            created_at=now,
            updated_at=now,
        )
        self.session.add(incident)
        self.session.commit()
        self.session.refresh(incident)
        return incident

    def list(self, **filters: str | None) -> list[Incident]:
        query = select(Incident).order_by(Incident.created_at.desc())
        for field, value in filters.items():
            if value is not None:
                query = query.where(getattr(Incident, field) == value)
        return list(self.session.scalars(query))

    def get(self, incident_id: str) -> Incident:
        incident = self.session.get(Incident, incident_id)
        if incident is None:
            raise IncidentNotFoundError(incident_id)
        return incident

    def update_status(self, incident_id: str, new_status: IncidentStatus) -> Incident:
        incident = self.get(incident_id)
        if new_status not in ALLOWED_TRANSITIONS.get(incident.status, set()):
            raise InvalidIncidentTransitionError(
                f"No se permite cambiar de {incident.status} a {new_status}."
            )
        incident.status = new_status
        incident.updated_at = datetime.now(timezone.utc)
        self.session.commit()
        self.session.refresh(incident)
        return incident

    def summary(self) -> dict[str, object]:
        incidents = self.list()
        return {
            "total": len(incidents),
            "by_status": dict(Counter(i.status for i in incidents)),
            "by_category": dict(Counter(i.category for i in incidents)),
            "by_origin": dict(Counter(i.origin for i in incidents)),
            "by_branch": dict(Counter(i.branch for i in incidents)),
        }
