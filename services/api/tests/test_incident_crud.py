from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from services.api.db import get_db
from services.api.main import app
from services.api.models.incident import Base


@pytest.fixture
def client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)

    def override_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def payload(title="Falta de material"):
    return {
        "title": title,
        "description": "No hay consumibles disponibles.",
        "category": "consumables",
        "origin": "branch",
        "branch": "US-TX-AUSTIN",
    }


def test_incident_crud_and_status_lifecycle(client):
    created = client.post("/api/incidents", json=payload()).json()
    incident_id = created["id"]
    assert created["status"] == "open"

    assert client.get("/api/incidents", params={"origin": "branch"}).json()[0]["id"] == incident_id
    assert client.patch(f"/api/incidents/{incident_id}/status", json={"status": "in_progress"}).status_code == 200
    assert client.patch(f"/api/incidents/{incident_id}/status", json={"status": "resolved"}).status_code == 200
    assert client.patch(f"/api/incidents/{incident_id}/status", json={"status": "open"}).status_code == 400
    assert client.get(f"/api/incidents/{incident_id}").status_code == 200
    assert client.get("/api/incidents/summary").json()["total"] == 1


def test_validation_and_not_found(client):
    response = client.post("/api/incidents", json={})
    assert response.status_code == 400
    assert response.json()["error"] == "validation_error"
    assert client.get("/api/incidents/missing").status_code == 404
