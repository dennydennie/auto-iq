#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:?set API_BASE to the deployed API origin, e.g. https://api-staging.up.railway.app/api/v1}"
SMOKE_EMAIL="${SMOKE_EMAIL:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$SMOKE_PASSWORD}"
DEBUG_TEST_ERROR_TOKEN="${DEBUG_TEST_ERROR_TOKEN:-}"

COOKIE_USER="/tmp/auto-iq-remote-user.cookies"
COOKIE_ADMIN="/tmp/auto-iq-remote-admin.cookies"

json_field() {
  node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); const path=process.argv[1].split("."); let cur=data; for (const key of path) cur = cur?.[key]; if (cur === undefined) process.exit(2); if (typeof cur === "object") console.log(JSON.stringify(cur)); else console.log(String(cur));' "$1"
}

catalogue_count() {
  node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); if (!Array.isArray(data.data)) { console.error("catalogue response did not include a data array"); process.exit(2); } console.log(data.data.length);'
}

catalogue_first_slug() {
  node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); console.log(data.data?.[0]?.slug ?? "");'
}

login() {
  local email=$1
  local password=$2
  local cookie_file=$3

  curl -fsS -X POST "$API_BASE/auth/login" \
    -c "$cookie_file" \
    -H 'Content-Type: application/json' \
    -d "{\"identifier\":\"$email\",\"password\":\"$password\"}" >/dev/null
}

LIVE=$(curl -fsS "$API_BASE/health/live")
READY=$(curl -fsS "$API_BASE/health/ready")
CATALOGUE=$(curl -fsS "$API_BASE/listings")

printf 'LIVE=%s\n' "$(printf '%s' "$LIVE" | json_field status)"
printf 'READY=%s\n' "$(printf '%s' "$READY" | json_field status)"
printf 'CATALOGUE_COUNT=%s\n' "$(printf '%s' "$CATALOGUE" | catalogue_count)"

FIRST_SLUG=$(printf '%s' "$CATALOGUE" | catalogue_first_slug)
if [ -n "$FIRST_SLUG" ]; then
  DETAIL=$(curl -fsS "$API_BASE/listings/$FIRST_SLUG")
  printf 'CATALOGUE_DETAIL_ID=%s\n' "$(printf '%s' "$DETAIL" | json_field id)"
fi

if [ -n "$SMOKE_EMAIL" ] && [ -n "$SMOKE_PASSWORD" ]; then
  login "$SMOKE_EMAIL" "$SMOKE_PASSWORD" "$COOKIE_USER"
  ME=$(curl -fsS -b "$COOKIE_USER" "$API_BASE/me")
  SELLER_LISTINGS=$(curl -fsS -b "$COOKIE_USER" "$API_BASE/me/listings")
  printf 'ME_ID=%s\n' "$(printf '%s' "$ME" | json_field id)"
  printf 'SELLER_LISTING_TOTAL=%s\n' "$(printf '%s' "$SELLER_LISTINGS" | json_field meta.total)"
fi

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$COOKIE_ADMIN"
  DASHBOARD=$(curl -fsS -b "$COOKIE_ADMIN" "$API_BASE/admin/dashboard")
  printf 'ADMIN_PENDING_REVIEW=%s\n' "$(printf '%s' "$DASHBOARD" | json_field queues.pendingReview)"
fi

if [ -n "$DEBUG_TEST_ERROR_TOKEN" ]; then
  DEBUG_CODE=$(curl -s -o /tmp/auto-iq-remote-debug.json -w '%{http_code}' \
    -H "X-Debug-Token: $DEBUG_TEST_ERROR_TOKEN" \
    "$API_BASE/_ops/test-error" || true)
  printf 'DEBUG_TEST_ERROR_STATUS=%s\n' "$DEBUG_CODE"
fi
