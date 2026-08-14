from __future__ import annotations

import pytest

from services.api.services.incidents_analysis_service import (
    IncidentAnalysisService,
    InvalidCSVError,
)


def test_analyze_csv_text_computes_expected_metrics() -> None:
    service = IncidentAnalysisService()
    csv_text = (
        "incident_id,category,status,satisfaction\n"
        "1,operaciones_clinicas,cerrado,4\n"
        "2,tecnologia,abierto,\n"
        "3,facturacion,foo,5\n"
        "4,,cerrado,3\n"
    )

    result = service.analyze_csv_text(csv_text)

    assert result.total_processed == 4
    assert result.total_valid == 2
    assert result.total_invalid == 2
    assert result.category_counts == {
        "operaciones_clinicas": 1,
        "tecnologia": 1,
    }
    assert result.status_counts == {
        "abierto": 1,
        "cerrado": 1,
    }
    assert result.invalid_reason_counts == {
        "faltante:category": 1,
        "valor_invalido:status": 1,
    }
    assert result.avg_closed_satisfaction == 4.0
    assert result.closed_scores_count == 1


def test_analyze_csv_text_empty_raises_invalid_csv_error() -> None:
    service = IncidentAnalysisService()

    with pytest.raises(InvalidCSVError, match="vacío"):
        service.analyze_csv_text("   ")


def test_analyze_csv_text_missing_required_headers_raises_invalid_csv_error() -> None:
    service = IncidentAnalysisService()

    with pytest.raises(InvalidCSVError, match="faltan columnas requeridas"):
        service.analyze_csv_text("foo,bar\n1,2\n")


def test_export_rows_to_csv_text_contains_metrics_rows() -> None:
    service = IncidentAnalysisService()
    result = service.analyze_csv_text(
        "incident_id,category,status,satisfaction\n"
        "1,operaciones_clinicas,cerrado,5\n"
    )

    rows = service.build_export_rows(result)
    csv_content = service.export_rows_to_csv_text(rows)

    assert csv_content.startswith("metric,value")
    assert "total_registros_procesados,1" in csv_content
    assert "conteo_categoria:operaciones_clinicas,1" in csv_content
    assert "satisfaccion_media_cerrados,5.00" in csv_content
