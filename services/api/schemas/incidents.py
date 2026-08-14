from __future__ import annotations

from typing import Dict, Optional

from pydantic import BaseModel, Field


class IncidentMetricsResponse(BaseModel):
    total_processed: int = Field(..., description="Total de registros procesados")
    total_valid: int = Field(..., description="Total de registros válidos")
    total_invalid: int = Field(..., description="Total de registros inválidos")
    invalid_reason_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Conteo de inválidos por tipo de error",
    )
    category_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Desglose de incidencias por categoría",
    )
    status_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Desglose de incidencias por estado",
    )
    avg_closed_satisfaction: Optional[float] = Field(
        default=None,
        description="Índice de satisfacción medio para incidencias cerradas",
    )
    closed_scores_count: int = Field(
        ...,
        description="Cantidad de casos cerrados con puntuación",
    )


class ErrorResponse(BaseModel):
    detail: str
