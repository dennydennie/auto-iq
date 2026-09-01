#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_ID="${MOBILE_E2E_RUN_ID:-$(date -u +%Y%m%d%H%M%S)}"
PASSWORD="${MOBILE_E2E_PASSWORD:-AutoIQ-E2E-9Pass}"
API_BASE="${API_BASE:-http://127.0.0.1:54000/api/v1}"
DATABASE_URL="${DATABASE_URL:-postgresql://auto_iq:auto_iq_e2e_dev@127.0.0.1:55433/auto_iq}"
WEB_PORT="${MOBILE_E2E_WEB_PORT:-57357}"
WEB_URL="http://127.0.0.1:${WEB_PORT}"
STORAGE_ORIGIN="${STORAGE_ENDPOINT:-http://127.0.0.1:59002}"
PWCLI="${PWCLI:-$HOME/.codex/skills/playwright/scripts/playwright_cli.sh}"
JOURNEYS="$ROOT_DIR/scripts/e2e/mobile-web-journeys.js"
OUTPUT_DIR="$ROOT_DIR/output/mobile-web-e2e/$RUN_ID"
SESSION_PREFIX="mobile-real-$RUN_ID"
WEB_PID=""

cleanup() {
  for role in buyer seller inspector; do
    "$PWCLI" --session "$SESSION_PREFIX-$role" close >/dev/null 2>&1 || true
  done
  if [[ -n "$WEB_PID" ]]; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
    wait "$WEB_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

require_runtime() {
  command -v flutter >/dev/null
  command -v node >/dev/null
  command -v python3 >/dev/null
  [[ -x "$PWCLI" ]]
  [[ -f "$JOURNEYS" ]]
}

wait_for_web() {
  for _ in {1..60}; do
    if curl -fsS "$WEB_URL" >/dev/null; then return; fi
    sleep 0.25
  done
  echo "Flutter Web did not start at $WEB_URL" >&2
  return 1
}

open_session() {
  local session="$1"
  "$PWCLI" --session "$session" open "$WEB_URL" --mobile
  "$PWCLI" --session "$session" sessionstorage-set mobileE2EPassword "$PASSWORD"
  "$PWCLI" --session "$session" sessionstorage-set mobileE2ERunId "$RUN_ID"
  "$PWCLI" --session "$session" sessionstorage-set mobileE2EStorageOrigin "$STORAGE_ORIGIN"
  assert_headless "$session"
}

assert_headless() {
  local session="$1"
  local details
  details="$("$PWCLI" list)"
  if ! grep -A5 -- "- $session:" <<<"$details" | grep -q "headed: false"; then
    echo "Browser session $session is not headless" >&2
    return 1
  fi
}

run_phase() {
  local session="$1"
  local phase="$2"
  "$PWCLI" --session "$session" sessionstorage-set mobileE2EPhase "$phase"
  "$PWCLI" --session "$session" run-code --filename "$JOURNEYS"
}

seed_real_catalogue() {
  local seed_run
  seed_run="$(date -u +%s)$(printf '%s' "$RUN_ID" | cksum | awk '{print $1}')"
  API_BASE="$API_BASE" DATABASE_URL="$DATABASE_URL" PASSWORD="$PASSWORD" \
    RUN_ID="$seed_run" \
    node "$ROOT_DIR/apps/api/scripts/seed-mobile-demo.mjs" \
    | tee "$OUTPUT_DIR/catalogue-fixture.json"
}

prepare_journey_fixture() {
  DATABASE_URL="$DATABASE_URL" MOBILE_E2E_RUN_ID="$RUN_ID" \
    MOBILE_E2E_PASSWORD="$PASSWORD" \
    node "$ROOT_DIR/apps/api/scripts/prepare-mobile-web-e2e.mjs" \
    | tee "$OUTPUT_DIR/journey-fixture.json"
}

build_and_serve_web() {
  if lsof -tiTCP:"$WEB_PORT" -sTCP:LISTEN >/dev/null; then
    echo "Port $WEB_PORT is already in use" >&2
    return 1
  fi
  if [[ "${MOBILE_E2E_SKIP_BUILD:-0}" != "1" ]]; then
    (cd "$ROOT_DIR/apps/mobile" && flutter build web --release \
      --dart-define="AUTO_IQ_API_BASE_URL=${API_BASE%/api/v1}")
  fi
  python3 -m http.server "$WEB_PORT" --bind 127.0.0.1 \
    --directory "$ROOT_DIR/apps/mobile/build/web" >"$OUTPUT_DIR/web.log" 2>&1 &
  WEB_PID="$!"
  wait_for_web
}

run_buyer() {
  local session="$SESSION_PREFIX-buyer"
  open_session "$session"
  run_phase "$session" buyer-auth
  run_phase "$session" buyer-listing
  run_phase "$session" buyer-finish
}

run_seller() {
  local session="$SESSION_PREFIX-seller"
  open_session "$session"
  run_phase "$session" seller-images
  "$PWCLI" --session "$session" upload "$ROOT_DIR/apps/web/public/images/honda-vezel-hero.jpg" \
    "$ROOT_DIR/apps/mobile/store-listing/screenshots/01-sign-in.png" \
    "$ROOT_DIR/apps/mobile/store-listing/screenshots/02-browse-and-filter.png"
  run_seller_documents "$session"
  run_phase "$session" seller-finish
}

run_seller_documents() {
  local session="$1"
  local document="$ROOT_DIR/scripts/e2e/fixtures/listing-document.pdf"
  for phase in seller-first-document seller-second-document seller-third-document; do
    run_phase "$session" "$phase"
    "$PWCLI" --session "$session" upload "$document"
  done
}

run_inspector() {
  local session="$SESSION_PREFIX-inspector"
  open_session "$session"
  run_phase "$session" inspector-evidence
  "$PWCLI" --session "$session" upload \
    "$ROOT_DIR/apps/web/public/images/honda-vezel-hero.jpg"
  run_phase "$session" inspector-finish
}

persist_run_id() {
  mkdir -p "$ROOT_DIR/output/mobile-web-e2e"
  printf '%s\n' "$RUN_ID" >"$ROOT_DIR/output/mobile-web-e2e/latest-run-id"
}

main() {
  require_runtime
  mkdir -p "$OUTPUT_DIR"
  node "$ROOT_DIR/scripts/e2e/mobile-real-stack-verify.mjs" readiness
  if [[ "${MOBILE_E2E_REUSE_FIXTURE:-0}" != "1" ]]; then
    seed_real_catalogue
    prepare_journey_fixture
  fi
  build_and_serve_web
  run_buyer
  run_seller
  run_inspector
  persist_run_id
  MOBILE_E2E_RUN_ID="$RUN_ID" \
    node "$ROOT_DIR/scripts/e2e/mobile-real-stack-verify.mjs" persistence
  echo "MOBILE REAL JOURNEYS PASSED"
}

main "$@"
