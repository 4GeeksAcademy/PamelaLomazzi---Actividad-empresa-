#!/usr/bin/env bash
set -euo pipefail

PID_DIR="/tmp/healthcore-dev"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

stop_pid_file() {
  local pid_file="$1"
  local name="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"

    if kill -0 "$pid" 2>/dev/null; then
      echo "Deteniendo $name (PID $pid)..."
      kill "$pid"
    else
      echo "$name no estaba corriendo."
    fi

    rm -f "$pid_file"
  else
    echo "No se encontro PID de $name."
  fi
}

stop_pid_file "$BACKEND_PID_FILE" "backend"
stop_pid_file "$FRONTEND_PID_FILE" "frontend"

echo "Listo."
