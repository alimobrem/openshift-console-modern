#!/usr/bin/env bash
# Stop agent + PostgreSQL after E2E tests.
# Usage: ./e2e/stop-agent.sh

set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.agent.yml"

podman compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null && echo "Agent stack stopped" || echo "No agent stack to stop"
