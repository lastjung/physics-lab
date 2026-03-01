#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$ROOT_DIR/ai_talk/AUTO_WATCH.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "auto-watch not running"
  exit 0
fi

PID="$(cat "$PID_FILE" || true)"
if [[ -n "${PID}" ]] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "auto-watch stopped (pid=$PID)"
else
  echo "auto-watch already stopped"
fi

rm -f "$PID_FILE"
