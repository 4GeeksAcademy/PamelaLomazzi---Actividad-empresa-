#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR"
FRONTEND_DIR="$ROOT_DIR/uis/talent-pipeline-tracker"
PID_DIR="/tmp/healthcore-dev"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG="$PID_DIR/backend.log"
FRONTEND_LOG="$PID_DIR/frontend.log"

mkdir -p "$PID_DIR"

backend_health_url="http://localhost:8000/health"
frontend_url="http://localhost:3000"

is_backend_up() {
  curl -fsS "$backend_health_url" >/dev/null 2>&1
}

is_frontend_up() {
  curl -fsS "$frontend_url" >/dev/null 2>&1
}

if is_backend_up; then
  echo "Backend ya responde en $backend_health_url."
elif [[ -f "$BACKEND_PID_FILE" ]] && kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
  echo "Backend ya esta corriendo con PID $(cat "$BACKEND_PID_FILE")."
else
  echo "Iniciando backend FastAPI en http://localhost:8000 ..."
  (
    cd "$BACKEND_DIR"
    exec python3 -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
  ) >"$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"
fi

if is_frontend_up; then
  echo "Frontend ya responde en $frontend_url."
elif [[ -f "$FRONTEND_PID_FILE" ]] && kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
  echo "Frontend ya esta corriendo con PID $(cat "$FRONTEND_PID_FILE")."
else
  echo "Iniciando frontend Next.js en http://localhost:3000 ..."
  (
    cd "$FRONTEND_DIR"
    exec npm run dev
  ) >"$FRONTEND_LOG" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"
fi

echo ""
echo "Servicios iniciados."
if [[ -f "$BACKEND_PID_FILE" ]]; then
  echo "- Backend PID: $(cat "$BACKEND_PID_FILE")"
else
  echo "- Backend PID: N/A (ya estaba corriendo)"
fi

if [[ -f "$FRONTEND_PID_FILE" ]]; then
  echo "- Frontend PID: $(cat "$FRONTEND_PID_FILE")"
else
  echo "- Frontend PID: N/A (ya estaba corriendo)"
fi
echo "- Backend log: $BACKEND_LOG"
echo "- Frontend log: $FRONTEND_LOG"
echo ""
echo "Para detener: ./scripts/dev_stop.sh"
