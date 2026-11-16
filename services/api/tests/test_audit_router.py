from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import jwt
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from services.api.main import app
from services.audit import record_audit_event, seed_audit_events
from services.database import get_db
from services.models import AuditEvent
from services.schemas import AuditActor, AuditEventCreate

TOKEN_SECRET = "test-secret-with-at-least-thirty-two-characters"


@pytest.fixture
def audit_db(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AUDIT_JWT_SECRET", TOKEN_SECRET)
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_get_db
    yield engine
    app.dependency_overrides.clear()
    app.dependency_overrides.update(previous_overrides)
    engine.dispose()


def _token(role: str, department_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "aud": "healthcore-audit",
            "department_id": department_id,
            "exp": now + timedelta(minutes=5),
            "iat": now,
            "iss": "healthcore",
            "role": role,
            "sub": str(uuid4()),
        },
        TOKEN_SECRET,
        algorithm="HS256",
    )


def _record(
    session: Session,
    department_id: str,
    action: str = "read",
) -> AuditEvent:
    actor = AuditActor(
        id=uuid4(),
        role="employee",
        department_id=department_id,
    )
    return record_audit_event(
        session,
        actor,
        AuditEventCreate(patient_ref=uuid4(), action=action),
    )


def test_admin_receives_only_allowlisted_audit_metadata(audit_db) -> None:
    with Session(audit_db) as session:
        _record(session, "clinical-ops")

    response = TestClient(app).get(
        "/api/audit/events",
        headers={"Authorization": f"Bearer {_token('admin', 'executive')}"},
    )

    assert response.status_code == 200
    event = response.json()[0]
    assert set(event) == {
        "id",
        "actor_id",
        "actor_role",
        "department_id",
        "patient_ref",
        "action",
        "occurred_at",
        "anomaly_detected",
    }
    assert UUID(event["patient_ref"])
    assert "diagnosis" not in event
    assert "patient_name" not in event


def test_supervisor_sees_only_their_department(audit_db) -> None:
    with Session(audit_db) as session:
        _record(session, "clinical-ops")
        _record(session, "revenue-cycle")

    response = TestClient(app).get(
        "/api/audit/events",
        headers={"Authorization": f"Bearer {_token('supervisor', 'clinical-ops')}"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["department_id"] == "clinical-ops"


def test_employee_cannot_open_general_audit_viewer(audit_db) -> None:
    response = TestClient(app).get(
        "/api/audit/events",
        headers={"Authorization": f"Bearer {_token('employee', 'clinical-ops')}"},
    )

    assert response.status_code == 403


def test_audit_viewer_requires_a_valid_signed_token(audit_db) -> None:
    client = TestClient(app)

    assert client.get("/api/audit/events").status_code == 401
    assert client.get(
        "/api/audit/events",
        headers={"Authorization": "Bearer not-a-signed-token"},
    ).status_code == 401


def test_seed_has_fifteen_synthetic_events_and_rejects_phi_fields(audit_db) -> None:
    with Session(audit_db) as session:
        seed_audit_events(session)
        events = session.exec(select(AuditEvent)).all()

    assert len(events) == 15
    assert {event.action for event in events} == {"read", "modify", "export"}
    assert all(isinstance(event.patient_ref, UUID) for event in events)
    with pytest.raises(ValidationError):
        AuditEventCreate.model_validate(
            {
                "patient_ref": str(uuid4()),
                "action": "read",
                "patient_name": "Synthetic Name",
                "diagnosis": "Sensitive diagnosis",
            }
        )


def test_seed_adds_fifteen_idempotent_examples_to_existing_events(audit_db) -> None:
    with Session(audit_db) as session:
        _record(session, "clinical-ops")
        seed_audit_events(session)
        seed_audit_events(session)
        events = session.exec(select(AuditEvent)).all()

    assert len(events) == 16


def test_tenth_access_within_five_minutes_is_flagged(audit_db) -> None:
    actor = AuditActor(
        id=uuid4(),
        role="employee",
        department_id="clinical-ops",
    )
    start = datetime.now(timezone.utc)

    with Session(audit_db, expire_on_commit=False) as session:
        anomaly_flags = [
            record_audit_event(
                session,
                actor,
                AuditEventCreate(patient_ref=uuid4(), action="read"),
                occurred_at=start + timedelta(seconds=index * 10),
            ).anomaly_detected
            for index in range(10)
        ]

    assert not any(anomaly_flags[:9])
    assert anomaly_flags[9] is True