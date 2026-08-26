from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from services.api.dependencies.auth import get_current_user
from services.api.models.auth import User, UserRole
from services.api.schemas.incidents import ErrorResponse, IncidentMetricsResponse
from services.api.services.incidents_analysis_service import (
    IncidentAnalysisResult,
    IncidentAnalysisService,
    InvalidCSVError,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])
analysis_service = IncidentAnalysisService()
_last_results_by_user: dict[str, IncidentAnalysisResult] = {}


@router.post(
    "/analyze",
    response_model=IncidentMetricsResponse,
    responses={400: {"model": ErrorResponse}},
)
async def analyze_incidents(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> IncidentMetricsResponse:

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

    _last_results_by_user[current_user.id] = result
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
def export_last_results(
    current_user: User = Depends(get_current_user),
    user_id: str | None = None,
) -> StreamingResponse:
    target_user_id = user_id or current_user.id
    if target_user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    result = _last_results_by_user.get(target_user_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay resultados para exportar. Ejecuta primero /api/incidents/analyze.",
        )

    rows = analysis_service.build_export_rows(result)
    csv_content = analysis_service.export_rows_to_csv_text(rows)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
