#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4000/api/v1}"
API_PACKAGE_DIR="${API_PACKAGE_DIR:-apps/api}"
RUN_ID="${RUN_ID:-$(date +%s)}"
: "${DATABASE_URL:?Set DATABASE_URL}"
PASSWORD="${PASSWORD:-auto-iq-phase7-${RUN_ID}-A9}"

ADMIN_EMAIL="phase4-admin-${RUN_ID}@example.com"
INSPECTOR_EMAIL="phase4-inspector-${RUN_ID}@example.com"
SECOND_INSPECTOR_EMAIL="phase7-inspector-${RUN_ID}@example.com"
SECOND_INSPECTOR_PHONE="+26379${RUN_ID: -4}8888"
SECOND_SELLER_EMAIL="phase7-seller-${RUN_ID}@example.com"
SECOND_SELLER_PHONE="+26379${RUN_ID: -4}7777"
BUYER_EMAIL="phase7-buyer-${RUN_ID}@example.com"
BUYER_PHONE="+26378${RUN_ID: -4}6666"

COOKIE_ADMIN="/tmp/auto-iq-phase7-admin-${RUN_ID}.cookies"
COOKIE_INSPECTOR="/tmp/auto-iq-phase7-inspector-${RUN_ID}.cookies"
COOKIE_SECOND_INSPECTOR="/tmp/auto-iq-phase7-inspector-2-${RUN_ID}.cookies"
COOKIE_SECOND_SELLER="/tmp/auto-iq-phase7-seller-${RUN_ID}.cookies"
COOKIE_BUYER="/tmp/auto-iq-phase7-buyer-${RUN_ID}.cookies"

json_field() {
  node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); const path=process.argv[1].split("."); let cur=data; for (const key of path) cur = cur?.[key]; if (cur === undefined) process.exit(2); if (typeof cur === "object") console.log(JSON.stringify(cur)); else console.log(String(cur));' "$1"
}

insert_user() {
  local email=$1
  local phone=$2
  local full_name=$3
  local city=$4
  local role=$5
  local bcrypt_hash user_id

  bcrypt_hash=$(cd "$API_PACKAGE_DIR" && node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync(process.argv[1], 10));" "$PASSWORD")
  user_id=$(psql "$DATABASE_URL" -Atq -c "
    INSERT INTO users (full_name, email, phone, password_hash, status, city, phone_verified, email_verified)
    VALUES ('$full_name', '$email', '$phone', '$bcrypt_hash', 'ACTIVE', '$city', true, true)
    RETURNING id;
  ")
  psql "$DATABASE_URL" -Atq -c "INSERT INTO user_roles (user_id, role) VALUES ('$user_id', '$role');" >/dev/null
  echo "$user_id"
}

login_with_csrf() {
  local email=$1
  local cookie_file=$2

  curl -fsS -X POST "$API_BASE/auth/login" \
    -c "$cookie_file" \
    -H 'Content-Type: application/json' \
    -d "{\"identifier\":\"$email\",\"password\":\"$PASSWORD\"}" >/dev/null

  curl -fsS -b "$cookie_file" -c "$cookie_file" "$API_BASE/auth/csrf" | json_field token
}

HEALTH=$(curl -fsS "$API_BASE/health/ready")
[ "$(printf '%s' "$HEALTH" | json_field status)" = "ok" ]

SEED_OUTPUT=$(API_BASE="$API_BASE" DATABASE_URL="$DATABASE_URL" API_PACKAGE_DIR="$API_PACKAGE_DIR" PASSWORD="$PASSWORD" RUN_ID="$RUN_ID" ./scripts/dev/seed-phase4-published-listing.sh)
LISTING_ID=$(printf '%s' "$SEED_OUTPUT" | awk '{print $NF}')
TASK_ID=$(psql "$DATABASE_URL" -Atq -c "SELECT id FROM inspection_tasks WHERE listing_id = '$LISTING_ID'")
ADMIN_ID=$(psql "$DATABASE_URL" -Atq -c "SELECT id FROM users WHERE email = '$ADMIN_EMAIL'")
INSPECTOR_ID=$(psql "$DATABASE_URL" -Atq -c "SELECT id FROM users WHERE email = '$INSPECTOR_EMAIL'")

SECOND_INSPECTOR_ID=$(insert_user "$SECOND_INSPECTOR_EMAIL" "$SECOND_INSPECTOR_PHONE" "Phase 7 Inspector Two" "Harare" "INSPECTOR")
SECOND_SELLER_REGISTER=$(curl -fsS -X POST "$API_BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Phase 7 Seller Two\",\"email\":\"$SECOND_SELLER_EMAIL\",\"phone\":\"$SECOND_SELLER_PHONE\",\"password\":\"$PASSWORD\",\"role\":\"SELLER\",\"city\":\"Harare\"}")
SECOND_SELLER_ID=$(printf '%s' "$SECOND_SELLER_REGISTER" | json_field userId)
BUYER_REGISTER=$(curl -fsS -X POST "$API_BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Phase 7 Buyer\",\"email\":\"$BUYER_EMAIL\",\"phone\":\"$BUYER_PHONE\",\"password\":\"$PASSWORD\",\"role\":\"BUYER\",\"city\":\"Harare\"}")
BUYER_ID=$(printf '%s' "$BUYER_REGISTER" | json_field userId)

SECOND_SELLER_CSRF=$(login_with_csrf "$SECOND_SELLER_EMAIL" "$COOKIE_SECOND_SELLER")
BUYER_CSRF=$(login_with_csrf "$BUYER_EMAIL" "$COOKIE_BUYER")
ADMIN_CSRF=$(login_with_csrf "$ADMIN_EMAIL" "$COOKIE_ADMIN")
INSPECTOR_CSRF=$(login_with_csrf "$INSPECTOR_EMAIL" "$COOKIE_INSPECTOR")
SECOND_INSPECTOR_CSRF=$(login_with_csrf "$SECOND_INSPECTOR_EMAIL" "$COOKIE_SECOND_INSPECTOR")

for consent in TERMS PRIVACY SELLER_RULES NO_SIDE_DEAL; do
  curl -fsS -X POST "$API_BASE/me/consents" \
    -b "$COOKIE_SECOND_SELLER" \
    -H "X-CSRF-Token: $SECOND_SELLER_CSRF" \
    -H 'Content-Type: application/json' \
    -d "{\"consentType\":\"$consent\",\"version\":\"1.0.0\",\"accepted\":true}" >/dev/null
done

PUBLIC_DETAIL=$(curl -fsS "$API_BASE/listings/$LISTING_ID")
if printf '%s' "$PUBLIC_DETAIL" | grep -q 'storageKey\|ownershipVerification\|inspectionTask\|documents'; then
  echo "public detail leaked private fields"
  exit 1
fi

UNAUTH_PUBLISH=$(curl -s -o /tmp/auto-iq-phase7-unauth.json -w '%{http_code}' -X POST "$API_BASE/admin/listings/$LISTING_ID/publish")
[ "$UNAUTH_PUBLISH" = "401" ]

SECOND_SELLER_TIMELINE=$(curl -s -o /tmp/auto-iq-phase7-seller-idor.json -w '%{http_code}' \
  -b "$COOKIE_SECOND_SELLER" "$API_BASE/listings/$LISTING_ID/timeline")
[ "$SECOND_SELLER_TIMELINE" = "404" ]

SECOND_INSPECTOR_REPORT=$(curl -s -o /tmp/auto-iq-phase7-inspector-idor.json -w '%{http_code}' -X POST \
  "$API_BASE/inspectors/inspection-tasks/$TASK_ID/report" \
  -b "$COOKIE_SECOND_INSPECTOR" \
  -H "X-CSRF-Token: $SECOND_INSPECTOR_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"findings":[{"category":"ENGINE","label":"Oil level","rating":"PASS","note":"OK"}],"inspectorNote":"Should not be accepted.","roadworthy":true}')
[ "$SECOND_INSPECTOR_REPORT" = "404" ]

MISSING_CSRF_QUOTE=$(curl -s -o /tmp/auto-iq-phase7-missing-csrf.json -w '%{http_code}' -X POST \
  "$API_BASE/listings/$LISTING_ID/quotes" \
  -b "$COOKIE_BUYER" \
  -H 'Content-Type: application/json' \
  -d '{"offerPriceUsd":18000,"paymentPlan":"FULL_CASH","message":"missing csrf"}')
[ "$MISSING_CSRF_QUOTE" = "403" ]

SAVE_RESPONSE=$(curl -fsS -X POST "$API_BASE/me/saved-vehicles/$LISTING_ID" \
  -b "$COOKIE_BUYER" \
  -H "X-CSRF-Token: $BUYER_CSRF")
[ "$(printf '%s' "$SAVE_RESPONSE" | json_field listing.id)" = "$LISTING_ID" ]

QUOTE_RESPONSE=$(curl -fsS -X POST "$API_BASE/listings/$LISTING_ID/quotes" \
  -b "$COOKIE_BUYER" \
  -H "X-CSRF-Token: $BUYER_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"offerPriceUsd":18100,"paymentPlan":"FULL_CASH","message":"Phase 7 quote"}')
QUOTE_ID=$(printf '%s' "$QUOTE_RESPONSE" | json_field id)

REFERENCE_DATA=$(curl -fsS -b "$COOKIE_BUYER" "$API_BASE/reference-data")
LOCATION_ID=$(printf '%s' "$REFERENCE_DATA" | json_field viewingLocations.0.id)
PREFERRED_DATE=$(node -e 'const d = new Date(Date.now() + 24 * 60 * 60 * 1000); console.log(d.toISOString().slice(0, 10));')

VIEWING_RESPONSE=$(curl -fsS -X POST "$API_BASE/listings/$LISTING_ID/viewings" \
  -b "$COOKIE_BUYER" \
  -H "X-CSRF-Token: $BUYER_CSRF" \
  -H 'Content-Type: application/json' \
  -d "{\"preferredDate\":\"$PREFERRED_DATE\",\"preferredTime\":\"10:00\",\"locationId\":\"$LOCATION_ID\",\"note\":\"Phase 7 smoke viewing\"}")
VIEWING_ID=$(printf '%s' "$VIEWING_RESPONSE" | json_field id)

CONFIRMED_AT=$(node -e 'console.log(new Date(Date.now() + 60 * 60 * 1000).toISOString())')
CONFIRMED_VIEWING=$(curl -fsS -X POST "$API_BASE/admin/viewings/$VIEWING_ID/confirm" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
  -H 'Content-Type: application/json' \
  -d "{\"confirmedAt\":\"$CONFIRMED_AT\",\"locationId\":\"$LOCATION_ID\",\"noteToParticipants\":\"Phase 7 confirmed slot\"}")
[ "$(printf '%s' "$CONFIRMED_VIEWING" | json_field status)" = "CONFIRMED" ]

sleep 2

VIEWING_NOTIFICATIONS=$(psql "$DATABASE_URL" -Atq -c "SELECT COUNT(*) FROM notifications WHERE template IN ('VIEWING_REQUESTED', 'VIEWING_CONFIRMED') AND payload->>'viewingId' = '$VIEWING_ID'")
[ "$VIEWING_NOTIFICATIONS" -ge 4 ]

DASHBOARD=$(curl -fsS -b "$COOKIE_ADMIN" "$API_BASE/admin/dashboard")
OPEN_QUOTES_API=$(printf '%s' "$DASHBOARD" | json_field openQuoteCount)
VIEWINGS_TODAY_API=$(printf '%s' "$DASHBOARD" | json_field viewingsTodayCount)
OPEN_QUOTES_DB=$(psql "$DATABASE_URL" -Atq -c "SELECT COUNT(*) FROM quote_requests WHERE status IN ('NEW', 'UNDER_REVIEW', 'COUNTERED')")
VIEWINGS_TODAY_DB=$(psql "$DATABASE_URL" -Atq -c "SELECT COUNT(*) FROM viewing_appointments WHERE status IN ('CONFIRMED', 'RESCHEDULED') AND confirmed_slot IS NOT NULL AND confirmed_slot::date = CURRENT_DATE")
[ "$OPEN_QUOTES_API" = "$OPEN_QUOTES_DB" ]
[ "$VIEWINGS_TODAY_API" = "$VIEWINGS_TODAY_DB" ]

printf 'HEALTH=%s\n' "$(printf '%s' "$HEALTH" | json_field status)"
printf 'LISTING_ID=%s\n' "$LISTING_ID"
printf 'QUOTE_ID=%s\n' "$QUOTE_ID"
printf 'VIEWING_ID=%s\n' "$VIEWING_ID"
printf 'SECOND_SELLER_TIMELINE_STATUS=%s\n' "$SECOND_SELLER_TIMELINE"
printf 'SECOND_INSPECTOR_REPORT_STATUS=%s\n' "$SECOND_INSPECTOR_REPORT"
printf 'MISSING_CSRF_QUOTE_STATUS=%s\n' "$MISSING_CSRF_QUOTE"
printf 'VIEWING_NOTIFICATION_ROWS=%s\n' "$VIEWING_NOTIFICATIONS"
printf 'OPEN_QUOTES=%s\n' "$OPEN_QUOTES_API"
printf 'VIEWINGS_TODAY=%s\n' "$VIEWINGS_TODAY_API"
