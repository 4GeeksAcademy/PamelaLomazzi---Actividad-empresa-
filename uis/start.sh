#!/usr/bin/env bash
set -euo pipefail

cd /app/uis/website
npm run dev &
website_pid=$!

cd /app/uis/talent-pipeline-tracker
npm run dev -- --hostname 0.0.0.0 --port 3001 --webpack &
backoffice_pid=$!

trap 'kill "$website_pid" "$backoffice_pid" 2>/dev/null || true' EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

wait -n "$website_pid" "$backoffice_pid"