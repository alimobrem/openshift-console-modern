#!/usr/bin/env bash
# Start agent + PostgreSQL for E2E tests.
# Usage: ./e2e/start-agent.sh

set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.agent.yml"

# Check if agent is already running
if curl -sf http://localhost:8080/healthz &>/dev/null; then
  echo "Agent already running on :8080 — reusing"
  exit 0
fi

echo "Starting agent + PostgreSQL..."
podman compose -f "$COMPOSE_FILE" up -d --build --wait 2>&1

echo "Agent ready on http://localhost:8080"
