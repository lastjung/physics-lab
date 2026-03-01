#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$ROOT_DIR/ai_talk/AUTO_WATCH.pid"
LOG_FILE="$ROOT_DIR/ai_talk/AUTO_WATCH.log"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" || true)"
  if [[ -n "${PID}" ]] && kill -0 "$PID" 2>/dev/null; then
    echo "auto-watch: RUNNING (pid=$PID)"
  else
    echo "auto-watch: UNKNOWN (pid file exists: $PID, process check unavailable or stopped)"
  fi
else
  echo "auto-watch: STOPPED"
fi

if [[ -f "$LOG_FILE" ]]; then
  echo "log: $LOG_FILE"
  echo "--- tail ---"
  tail -n 20 "$LOG_FILE"
fi
