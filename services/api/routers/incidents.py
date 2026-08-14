from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from services.api.schemas.incidents import ErrorResponse, IncidentMetricsResponse
from services.api.services.incidents_analysis_service import (
    IncidentAnalysisResult,
    IncidentAnalysisService,
    InvalidCSVError,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])
analysis_service = IncidentAnalysisService()
_last_result: IncidentAnalysisResult | None = None


@router.post(
    "/analyze",
    response_model=IncidentMetricsResponse,
    responses={400: {"model": ErrorResponse}},
)
async def analyze_incidents(file: UploadFile = File(...)) -> IncidentMetricsResponse:
    global _last_result

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar un archivo CSV.",
        )

    filename = file.filename.lower()
    content_type = (file.content_type or "").lower()
    if not filename.endswith(".csv") and "csv" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un CSV válido.",
        )

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío.",
        )

    try:
        csv_text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo decodificar el archivo. Usa UTF-8.",
        ) from exc

    try:
        result = analysis_service.analyze_csv_text(csv_text)
    except InvalidCSVError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    _last_result = result
    return IncidentMetricsResponse(
        total_processed=result.total_processed,
        total_valid=result.total_valid,
        total_invalid=result.total_invalid,
        invalid_reason_counts=result.invalid_reason_counts,
        category_counts=result.category_counts,
        status_counts=result.status_counts,
        avg_closed_satisfaction=result.avg_closed_satisfaction,
        closed_scores_count=result.closed_scores_count,
    )


@router.get(
    "/results/export",
    responses={400: {"model": ErrorResponse}},
)
def export_last_results() -> StreamingResponse:
    if _last_result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay resultados para exportar. Ejecuta primero /api/incidents/analyze.",
        )

    rows = analysis_service.build_export_rows(_last_result)
    csv_content = analysis_service.export_rows_to_csv_text(rows)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
