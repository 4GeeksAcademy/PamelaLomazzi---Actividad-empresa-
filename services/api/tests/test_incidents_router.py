from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from services.api.db import auth_repository
from services.api.main import app
from services.api.models.auth import Profile, User, UserRole
from services.api.routers import incidents as incidents_router_module
from services.api.security.auth import get_password_hash


@pytest.fixture(autouse=True)
def reset_last_result() -> None:
    incidents_router_module._last_results_by_user = {}


@pytest.fixture(autouse=True)
def isolated_auth_db(tmp_path: Path) -> None:
    auth_repository.DB_PATH = tmp_path / "auth_test_db.json"
    if auth_repository._db is not None:
        auth_repository._db.close()
    auth_repository._db = None
    yield
    if auth_repository._db is not None:
        auth_repository._db.close()
    auth_repository._db = None


def _seed_user(*, user_id: str, email: str, password: str, role: UserRole) -> None:
    user = User(
        id=user_id,
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
    )
    profile = Profile(
        id=f"profile-{user_id}",
        user_id=user_id,
        name=f"Name {user_id}",
        phone="+34 600 123 456",
        address="Address",
    )
    auth_repository.upsert_user(user)
    auth_repository.upsert_profile(profile)


def _auth_header(email: str, password: str) -> dict[str, str]:
    client = TestClient(app)
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_export_without_previous_analysis_returns_400() -> None:
    _seed_user(
        user_id="user-1",
        email="user@example.com",
        password="secret",
        role=UserRole.user,
    )
    headers = _auth_header("user@example.com", "secret")
    client = TestClient(app)

    response = client.get("/api/incidents/results/export", headers=headers)

    assert response.status_code == 400
    assert "No hay resultados para exportar" in response.json()["detail"]


def test_analyze_and_export_flow_works() -> None:
    _seed_user(
        user_id="user-1",
        email="user@example.com",
        password="secret",
        role=UserRole.user,
    )
    headers = _auth_header("user@example.com", "secret")
    client = TestClient(app)
    csv_ok = (
        "incident_id,category,status,satisfaction\n"
        "1,operaciones_clinicas,cerrado,4\n"
        "2,tecnologia,abierto,\n"
        "3,facturacion,foo,5\n"
    )

    analyze_response = client.post(
        "/api/incidents/analyze",
        headers=headers,
        files={"file": ("incidents.csv", csv_ok, "text/csv")},
    )

    assert analyze_response.status_code == 200
    payload = analyze_response.json()
    assert payload["total_processed"] == 3
    assert payload["total_valid"] == 2
    assert payload["total_invalid"] == 1
    assert payload["invalid_reason_counts"] == {"valor_invalido:status": 1}
    assert payload["avg_closed_satisfaction"] == 4.0

    export_response = client.get("/api/incidents/results/export", headers=headers)

    assert export_response.status_code == 200
    assert export_response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=results.csv" == export_response.headers[
        "content-disposition"
    ]
    assert "metric,value" in export_response.text
    assert "total_registros_procesados,3" in export_response.text


def test_analyze_empty_file_returns_400() -> None:
    _seed_user(
        user_id="user-1",
        email="user@example.com",
        password="secret",
        role=UserRole.user,
    )
    headers = _auth_header("user@example.com", "secret")
    client = TestClient(app)

    response = client.post(
        "/api/incidents/analyze",
        headers=headers,
        files={"file": ("empty.csv", "", "text/csv")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "El archivo está vacío."


def test_analyze_invalid_header_returns_400() -> None:
    _seed_user(
        user_id="user-1",
        email="user@example.com",
        password="secret",
        role=UserRole.user,
    )
    headers = _auth_header("user@example.com", "secret")
    client = TestClient(app)

    response = client.post(
        "/api/incidents/analyze",
        headers=headers,
        files={"file": ("bad.csv", "foo,bar\n1,2\n", "text/csv")},
    )

    assert response.status_code == 400
    assert "faltan columnas requeridas" in response.json()["detail"]


def test_incidents_routes_return_401_when_unauthenticated() -> None:
    client = TestClient(app)

    analyze_response = client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", "incident_id,category,status,satisfaction\n", "text/csv")},
    )
    export_response = client.get("/api/incidents/results/export")

    assert analyze_response.status_code == 401
    assert export_response.status_code == 401


def test_export_foreign_user_results_returns_403_for_non_admin() -> None:
    _seed_user(
        user_id="owner-1",
        email="owner@example.com",
        password="owner-secret",
        role=UserRole.user,
    )
    _seed_user(
        user_id="other-1",
        email="other@example.com",
        password="other-secret",
        role=UserRole.user,
    )
    owner_headers = _auth_header("owner@example.com", "owner-secret")
    other_headers = _auth_header("other@example.com", "other-secret")
    client = TestClient(app)

    analyze_response = client.post(
        "/api/incidents/analyze",
        headers=owner_headers,
        files={
            "file": (
                "incidents.csv",
                "incident_id,category,status,satisfaction\n1,operaciones_clinicas,cerrado,4\n",
                "text/csv",
            )
        },
    )
    assert analyze_response.status_code == 200

    forbidden_response = client.get(
        "/api/incidents/results/export",
        headers=other_headers,
        params={"user_id": "owner-1"},
    )

    assert forbidden_response.status_code == 403
    assert forbidden_response.json()["detail"] == "Not enough permissions"
