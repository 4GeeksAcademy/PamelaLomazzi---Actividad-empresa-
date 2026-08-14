from __future__ import annotations

import csv
from collections import Counter
from dataclasses import dataclass
from io import StringIO
from statistics import mean
from typing import Dict, Iterable, List, Optional, TextIO, Tuple

REQUIRED_FIELDS = ("incident_id", "category", "status")

FIELD_ALIASES = {
    "incident_id": {
        "incident_id",
        "id",
        "id_incidencia",
        "incidencia_id",
        "ticket_id",
    },
    "category": {
        "category",
        "categoria",
        "categoría",
        "tipo",
        "area",
        "área",
    },
    "status": {
        "status",
        "estado",
        "state",
    },
    "satisfaction": {
        "satisfaction",
        "satisfaction_score",
        "satisfaccion",
        "satisfacción",
        "csat",
        "rating",
        "puntuacion",
        "puntuación",
    },
}

STATUS_ALIASES = {
    "abierto": "abierto",
    "open": "abierto",
    "pendiente": "abierto",
    "en_progreso": "abierto",
    "en progreso": "abierto",
    "in_progress": "abierto",
    "closed": "cerrado",
    "cerrado": "cerrado",
    "resuelto": "cerrado",
    "resolved": "cerrado",
    "discarded": "descartado",
    "descartado": "descartado",
    "cancelado": "descartado",
    "cancelled": "descartado",
}

CATEGORY_ALIASES = {
    "operaciones_clinicas": "operaciones_clinicas",
    "operaciones clinicas": "operaciones_clinicas",
    "operaciones clínicas": "operaciones_clinicas",
    "clinica": "operaciones_clinicas",
    "clínica": "operaciones_clinicas",
    "experiencia_paciente": "experiencia_paciente",
    "experiencia del paciente": "experiencia_paciente",
    "acceso_paciente": "experiencia_paciente",
    "patient_experience": "experiencia_paciente",
    "facturacion": "facturacion",
    "facturación": "facturacion",
    "billing": "facturacion",
    "ingresos": "facturacion",
    "cumplimiento_datos": "cumplimiento_datos",
    "cumplimiento": "cumplimiento_datos",
    "compliance": "cumplimiento_datos",
    "gobernanza_datos": "cumplimiento_datos",
    "rrhh": "rrhh",
    "recursos_humanos": "rrhh",
    "human_resources": "rrhh",
    "tecnologia": "tecnologia",
    "tecnología": "tecnologia",
    "technology": "tecnologia",
    "direccion_ejecutiva": "direccion_ejecutiva",
    "dirección ejecutiva": "direccion_ejecutiva",
    "executive": "direccion_ejecutiva",
}


class InvalidCSVError(ValueError):
    """Error de validación de formato CSV de entrada."""


@dataclass(frozen=True)
class IncidentAnalysisResult:
    total_processed: int
    total_valid: int
    total_invalid: int
    category_counts: Dict[str, int]
    status_counts: Dict[str, int]
    invalid_reason_counts: Dict[str, int]
    avg_closed_satisfaction: Optional[float]
    closed_scores_count: int


class IncidentAnalysisService:
    def analyze_csv_text(self, csv_text: str) -> IncidentAnalysisResult:
        if not csv_text or not csv_text.strip():
            raise InvalidCSVError("El archivo está vacío.")

        stream = StringIO(csv_text)
        return self._analyze_csv_stream(stream)

    def _analyze_csv_stream(self, stream: TextIO) -> IncidentAnalysisResult:
        total_processed = 0
        total_valid = 0
        total_invalid = 0

        category_counts: Counter[str] = Counter()
        status_counts: Counter[str] = Counter()
        invalid_reason_counts: Counter[str] = Counter()
        closed_satisfaction_scores: List[float] = []

        try:
            reader = csv.DictReader(stream)
            if not reader.fieldnames:
                raise InvalidCSVError("El CSV no contiene cabeceras.")

            column_map = self._resolve_columns(reader.fieldnames)
            missing_required_in_header = [
                field for field in REQUIRED_FIELDS if not column_map.get(field)
            ]
            if missing_required_in_header:
                missing = ", ".join(missing_required_in_header)
                raise InvalidCSVError(
                    f"El CSV no es válido: faltan columnas requeridas en cabecera ({missing})."
                )

            for row in reader:
                total_processed += 1
                row_errors: List[str] = []

                incident_id = self._get_value(row, column_map["incident_id"])
                category_raw = self._get_value(row, column_map["category"])
                status_raw = self._get_value(row, column_map["status"])
                satisfaction_raw = self._get_value(row, column_map.get("satisfaction"))

                if not incident_id:
                    row_errors.append("faltante:incident_id")
                if not category_raw:
                    row_errors.append("faltante:category")
                if not status_raw:
                    row_errors.append("faltante:status")

                category = self._normalize_category(category_raw) if category_raw else None
                status = self._normalize_status(status_raw) if status_raw else None

                if category_raw and category is None:
                    row_errors.append("valor_invalido:category")
                if status_raw and status is None:
                    row_errors.append("valor_invalido:status")

                if row_errors:
                    total_invalid += 1
                    for err in row_errors:
                        invalid_reason_counts[err] += 1
                    continue

                total_valid += 1
                category_counts[category] += 1  # type: ignore[arg-type]
                status_counts[status] += 1  # type: ignore[arg-type]

                if status == "cerrado":
                    score = self._parse_satisfaction(satisfaction_raw)
                    if score is not None:
                        closed_satisfaction_scores.append(score)
        except csv.Error as exc:
            raise InvalidCSVError("El archivo no tiene un formato CSV válido.") from exc

        avg_satisfaction = (
            mean(closed_satisfaction_scores) if closed_satisfaction_scores else None
        )

        return IncidentAnalysisResult(
            total_processed=total_processed,
            total_valid=total_valid,
            total_invalid=total_invalid,
            category_counts=dict(sorted(category_counts.items())),
            status_counts=dict(sorted(status_counts.items())),
            invalid_reason_counts=dict(sorted(invalid_reason_counts.items())),
            avg_closed_satisfaction=avg_satisfaction,
            closed_scores_count=len(closed_satisfaction_scores),
        )

    def build_export_rows(self, result: IncidentAnalysisResult) -> List[Tuple[str, str]]:
        rows: List[Tuple[str, str]] = [
            ("total_registros_procesados", str(result.total_processed)),
            ("total_registros_validos", str(result.total_valid)),
            ("total_registros_invalidos", str(result.total_invalid)),
        ]

        for category, count in result.category_counts.items():
            rows.append((f"conteo_categoria:{category}", str(count)))

        for status, count in result.status_counts.items():
            rows.append((f"conteo_estado:{status}", str(count)))

        for reason, count in result.invalid_reason_counts.items():
            rows.append((f"invalidos:{reason}", str(count)))

        rows.append(
            (
                "satisfaccion_media_cerrados",
                (
                    f"{result.avg_closed_satisfaction:.2f}"
                    if result.avg_closed_satisfaction is not None
                    else "N/A"
                ),
            )
        )
        rows.append(
            (
                "cantidad_casos_cerrados_con_satisfaccion",
                str(result.closed_scores_count),
            )
        )
        return rows

    def export_rows_to_csv_text(self, rows: List[Tuple[str, str]]) -> str:
        out = StringIO()
        writer = csv.writer(out)
        writer.writerow(["metric", "value"])
        writer.writerows(rows)
        return out.getvalue()

    @staticmethod
    def _normalize_text(value: str) -> str:
        return value.strip().lower()

    def _resolve_columns(self, headers: Iterable[str]) -> Dict[str, Optional[str]]:
        normalized_to_original = {self._normalize_text(h): h for h in headers}
        resolved: Dict[str, Optional[str]] = {}

        for canonical, aliases in FIELD_ALIASES.items():
            resolved_col = None
            for alias in aliases:
                if alias in normalized_to_original:
                    resolved_col = normalized_to_original[alias]
                    break
            resolved[canonical] = resolved_col

        return resolved

    @staticmethod
    def _get_value(row: Dict[str, str], col: Optional[str]) -> str:
        if not col:
            return ""
        return (row.get(col) or "").strip()

    def _normalize_status(self, raw_status: str) -> Optional[str]:
        normalized = self._normalize_text(raw_status)
        return STATUS_ALIASES.get(normalized)

    def _normalize_category(self, raw_category: str) -> Optional[str]:
        normalized = self._normalize_text(raw_category)
        return CATEGORY_ALIASES.get(normalized)

    @staticmethod
    def _parse_satisfaction(raw: str) -> Optional[float]:
        raw = raw.strip()
        if not raw:
            return None

        try:
            return float(raw.replace(",", "."))
        except ValueError:
            return None
