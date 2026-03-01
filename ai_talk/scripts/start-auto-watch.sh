#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$ROOT_DIR/ai_talk/AUTO_WATCH.pid"
LOG_FILE="$ROOT_DIR/ai_talk/AUTO_WATCH.log"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "auto-watch already running (pid=$OLD_PID)"
    exit 0
  fi
fi

cd "$ROOT_DIR"
nohup node ai_talk/scripts/auto-orchestrator.mjs >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "auto-watch started (pid=$NEW_PID)"
echo "log: $LOG_FILE"
