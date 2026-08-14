#!/usr/bin/env python3
"""Fase 1: validación y análisis de incidencias de postventa.

Uso:
    python scripts/analyze.py scripts/incidents-COMPANY.csv
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.api.services.incidents_analysis_service import (  # noqa: E402
    IncidentAnalysisResult,
    IncidentAnalysisService,
    InvalidCSVError,
)

analysis_service = IncidentAnalysisService()


def analyze_file(csv_path: str) -> Tuple[List[Tuple[str, str]], Dict[str, object]]:
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        csv_text = f.read()

    result = analysis_service.analyze_csv_text(csv_text)
    rows_for_export = analysis_service.build_export_rows(result)
    metrics = metrics_from_result(result)
    return rows_for_export, metrics


def metrics_from_result(result: IncidentAnalysisResult) -> Dict[str, object]:
    return {
        "total_processed": result.total_processed,
        "total_valid": result.total_valid,
        "total_invalid": result.total_invalid,
        "category_counts": result.category_counts,
        "status_counts": result.status_counts,
        "invalid_reason_counts": result.invalid_reason_counts,
        "avg_closed_satisfaction": result.avg_closed_satisfaction,
        "closed_scores_count": result.closed_scores_count,
    }


def print_section(title: str) -> None:
    width = 72
    print("=" * width)
    print(title.center(width))
    print("=" * width)


def print_kv(key: str, value: str, key_width: int = 48) -> None:
    print(f"{key:<{key_width}} : {value}")


def print_report(metrics: Dict[str, object]) -> None:
    print_section("RESUMEN DE ANALISIS DE INCIDENCIAS")

    print_kv("Total de registros procesados", str(metrics["total_processed"]))
    print_kv("Total de registros validos", str(metrics["total_valid"]))
    print_kv("Total de registros invalidos", str(metrics["total_invalid"]))
    print()

    print_section("CONTEO POR CATEGORIA (SOLO VALIDOS)")
    category_counts = metrics["category_counts"]
    if category_counts:
        for category, count in sorted(category_counts.items()):
            print_kv(category, str(count))
    else:
        print_kv("Sin datos", "0")
    print()

    print_section("CONTEO POR ESTADO (SOLO VALIDOS)")
    status_counts = metrics["status_counts"]
    if status_counts:
        for status, count in sorted(status_counts.items()):
            print_kv(status, str(count))
    else:
        print_kv("Sin datos", "0")
    print()

    print_section("REGISTROS INVALIDOS POR TIPO DE ERROR")
    invalid_reason_counts = metrics["invalid_reason_counts"]
    if invalid_reason_counts:
        for reason, count in sorted(invalid_reason_counts.items()):
            print_kv(reason, str(count))
    else:
        print_kv("Sin errores de validacion", "0")
    print()

    print_section("SATISFACCION EN CASOS CERRADOS")
    avg = metrics["avg_closed_satisfaction"]
    scored_count = metrics["closed_scores_count"]

    if avg is None:
        print_kv("Indice medio de satisfaccion", "N/A")
    else:
        print_kv("Indice medio de satisfaccion", f"{avg:.2f}")
    print_kv("Casos cerrados con puntuacion", str(scored_count))


def export_results(rows: List[Tuple[str, str]], output_path: str = "results.csv") -> None:
    csv_content = analysis_service.export_rows_to_csv_text(rows)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        f.write(csv_content)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validar y analizar un fichero CSV de incidencias de postventa."
    )
    parser.add_argument("csv_path", help="Ruta al archivo CSV de incidencias")
    args = parser.parse_args()

    csv_path = args.csv_path

    if not os.path.isfile(csv_path):
        print(f"Error: no existe el archivo '{csv_path}'.", file=sys.stderr)
        return 1

    try:
        rows_for_export, metrics = analyze_file(csv_path)
    except (InvalidCSVError, ValueError) as exc:
        print(f"Error al procesar el CSV: {exc}", file=sys.stderr)
        return 1

    print_report(metrics)
    print()

    answer = input("¿Deseas exportar los resultados a CSV? [s / n]: ").strip().lower()
    if answer == "s":
        export_results(rows_for_export)
        print("Archivo results.csv generado correctamente.")
    else:
        print("Exportacion omitida.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
