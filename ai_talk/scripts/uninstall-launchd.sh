#!/usr/bin/env bash
set -euo pipefail

PLIST_PATH="$HOME/Library/LaunchAgents/com.physicslab.ai-orchestrator.plist"

launchctl bootout "gui/$(id -u)/com.physicslab.ai-orchestrator" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"

echo "launchd uninstalled: $PLIST_PATH"
