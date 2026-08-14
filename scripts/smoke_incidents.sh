#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSV_PATH="${1:-$ROOT_DIR/scripts/incidents-COMPANY.csv}"
BASE_URL="${2:-http://localhost:8000}"

if [[ ! -f "$CSV_PATH" ]]; then
  echo "ERROR: no existe CSV en $CSV_PATH"
  exit 1
fi

echo "[1/4] Health check: $BASE_URL/health"
HEALTH_JSON="$(curl -fsS "$BASE_URL/health")"
python3 - << 'PY' "$HEALTH_JSON"
import json
import sys
payload = json.loads(sys.argv[1])
assert payload.get("status") == "ok", payload
print("OK health")
PY

echo "[2/4] Analyze CSV: $BASE_URL/api/incidents/analyze"
ANALYZE_JSON="$(curl -fsS -X POST "$BASE_URL/api/incidents/analyze" -F "file=@$CSV_PATH;type=text/csv")"
python3 - << 'PY' "$ANALYZE_JSON"
import json
import sys
payload = json.loads(sys.argv[1])
required = ["total_processed", "total_valid", "total_invalid", "category_counts", "status_counts"]
missing = [k for k in required if k not in payload]
assert not missing, f"Missing keys: {missing}"
print(f"OK analyze: total_processed={payload['total_processed']} valid={payload['total_valid']} invalid={payload['total_invalid']}")
PY

echo "[3/4] Export CSV: $BASE_URL/api/incidents/results/export"
TMP_CSV="$(mktemp /tmp/incidents-results-XXXXXX.csv)"
HTTP_CODE="$(curl -sS -o "$TMP_CSV" -w "%{http_code}" "$BASE_URL/api/incidents/results/export")"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "ERROR: export retorno HTTP $HTTP_CODE"
  exit 1
fi

echo "[4/4] Validating exported CSV structure"
python3 - << 'PY' "$TMP_CSV"
import csv
import sys
path = sys.argv[1]
with open(path, newline="", encoding="utf-8") as f:
    rows = list(csv.reader(f))
assert rows, "CSV vacio"
assert rows[0] == ["metric", "value"], rows[0]
assert len(rows) > 2, "CSV sin metricas"
print(f"OK export: {len(rows)-1} metricas")
PY

echo "Smoke test completado correctamente."
echo "Archivo exportado temporal: $TMP_CSV"
