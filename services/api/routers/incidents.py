from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse

from services.api.schemas.incidents import ErrorResponse, IncidentMetricsResponse
from services.api.schemas.incident_crud import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
    IncidentSummary,
)
from services.api.db import get_db
from services.api.services.incidents_service import (
    IncidentNotFoundError,
    IncidentsService,
    InvalidIncidentTransitionError,
)
from sqlalchemy.orm import Session
from services.api.services.incidents_analysis_service import (
    IncidentAnalysisResult,
    IncidentAnalysisService,
    InvalidCSVError,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])
analysis_service = IncidentAnalysisService()
_last_result: IncidentAnalysisResult | None = None


def _service(db: Session) -> IncidentsService:
    return IncidentsService(db)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> IncidentResponse:
    return _service(db).create(payload)


@router.get("", response_model=list[IncidentResponse])
def list_incidents(
    status_filter: str | None = Query(default=None, alias="status"),
    origin: str | None = None,
    branch: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[IncidentResponse]:
    return _service(db).list(
        status=status_filter, origin=origin, branch=branch, category=category
    )


@router.get("/summary", response_model=IncidentSummary)
def incident_summary(db: Session = Depends(get_db)) -> IncidentSummary:
    return _service(db).summary()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentResponse:
    try:
        return _service(db).get(incident_id)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.") from exc


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
) -> IncidentResponse:
    try:
        return _service(db).update_status(incident_id, payload.status)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.") from exc
    except InvalidIncidentTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


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
