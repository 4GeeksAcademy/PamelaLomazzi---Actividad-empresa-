from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.routers import incidents as incidents_router_module


@pytest.fixture(autouse=True)
def reset_last_result() -> None:
    incidents_router_module._last_result = None


def test_export_without_previous_analysis_returns_400() -> None:
    client = TestClient(app)

    response = client.get("/api/incidents/results/export")

    assert response.status_code == 400
    assert "No hay resultados para exportar" in response.json()["detail"]


def test_analyze_and_export_flow_works() -> None:
    client = TestClient(app)
    csv_ok = (
        "incident_id,category,status,satisfaction\n"
        "1,operaciones_clinicas,cerrado,4\n"
        "2,tecnologia,abierto,\n"
        "3,facturacion,foo,5\n"
    )

    analyze_response = client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", csv_ok, "text/csv")},
    )

    assert analyze_response.status_code == 200
    payload = analyze_response.json()
    assert payload["total_processed"] == 3
    assert payload["total_valid"] == 2
    assert payload["total_invalid"] == 1
    assert payload["invalid_reason_counts"] == {"valor_invalido:status": 1}
    assert payload["avg_closed_satisfaction"] == 4.0

    export_response = client.get("/api/incidents/results/export")

    assert export_response.status_code == 200
    assert export_response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=results.csv" == export_response.headers[
        "content-disposition"
    ]
    assert "metric,value" in export_response.text
    assert "total_registros_procesados,3" in export_response.text


def test_analyze_empty_file_returns_400() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("empty.csv", "", "text/csv")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "El archivo está vacío."


def test_analyze_invalid_header_returns_400() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("bad.csv", "foo,bar\n1,2\n", "text/csv")},
    )

    assert response.status_code == 400
    assert "faltan columnas requeridas" in response.json()["detail"]
