#!/usr/bin/env bash
set -euo pipefail

launchctl print "gui/$(id -u)/com.physicslab.ai-orchestrator" | sed -n '1,120p'
