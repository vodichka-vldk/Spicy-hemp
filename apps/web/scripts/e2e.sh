#!/usr/bin/env bash
# Builds the app, starts it on a clean local store and runs the browser tests. Usage: npm run e2e
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-3199}"
export NEXT_PUBLIC_SITE_URL="http://localhost:$PORT" ADMIN_PASSWORD=test123 ADMIN_EMAIL=admin
export TELEGRAM_BOT_TOKEN=123456:E2E TELEGRAM_WEBHOOK_SECRET=e2e-secret CRON_SECRET=e2e-cron
unset SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
rm -rf .data
npx next build
npx next start -p "$PORT" > /tmp/sh-e2e-server.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do curl -fs "http://localhost:$PORT/api/health" > /dev/null && break; sleep 1; done
curl -fs "http://localhost:$PORT/api/health" > /dev/null || { echo "server did not start"; cat /tmp/sh-e2e-server.log; exit 1; }
BASE="http://localhost:$PORT" node tests/e2e/smoke.mjs
BASE="http://localhost:$PORT" node tests/e2e/audit.mjs
