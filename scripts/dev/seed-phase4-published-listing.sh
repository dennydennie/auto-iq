#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4000/api/v1}"
API_PACKAGE_DIR="${API_PACKAGE_DIR:-apps/api}"
RUN_ID="${RUN_ID:-$(date +%s)}"
: "${DATABASE_URL:?Set DATABASE_URL}"
PASSWORD="${PASSWORD:-auto-iq-phase4-${RUN_ID}-A9}"
SELLER_EMAIL="phase4-seller-${RUN_ID}@example.com"
SELLER_PHONE="+26377${RUN_ID: -4}1111"
ADMIN_EMAIL="phase4-admin-${RUN_ID}@example.com"
ADMIN_PHONE="+26377${RUN_ID: -4}2222"
INSPECTOR_EMAIL="phase4-inspector-${RUN_ID}@example.com"
INSPECTOR_PHONE="+26377${RUN_ID: -4}3333"

COOKIE_SELLER="/tmp/auto-iq-seed-seller-${RUN_ID}.cookies"
COOKIE_ADMIN="/tmp/auto-iq-seed-admin-${RUN_ID}.cookies"
COOKIE_INSPECTOR="/tmp/auto-iq-seed-inspector-${RUN_ID}.cookies"
IMAGE_FILE="/tmp/auto-iq-seed-${RUN_ID}.jpg"
PDF_FILE="/tmp/auto-iq-seed-${RUN_ID}.pdf"

printf '\377\330\377\340\000\020JFIF\000\001\001\001\000H\000H\000\000\377\331' > "$IMAGE_FILE"
printf '%%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%%%EOF\n' > "$PDF_FILE"

IMAGE_LEN=$(wc -c < "$IMAGE_FILE" | tr -d ' ')
PDF_LEN=$(wc -c < "$PDF_FILE" | tr -d ' ')
BCRYPT_HASH=$(cd "$API_PACKAGE_DIR" && node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync(process.argv[1], 10));" "$PASSWORD")

insert_user() {
  local email=$1
  local phone=$2
  local full_name=$3
  local city=$4
  local role=$5
  local user_id

  user_id=$(psql "$DATABASE_URL" -Atq -c "
    INSERT INTO users (full_name, email, phone, password_hash, status, city, phone_verified, email_verified)
    VALUES ('$full_name', '$email', '$phone', '$BCRYPT_HASH', 'ACTIVE', '$city', true, true)
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

  curl -fsS -b "$cookie_file" -c "$cookie_file" "$API_BASE/auth/csrf" \
    | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).token)'
}

register_seller() {
  curl -fsS -X POST "$API_BASE/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"fullName\":\"Phase 4 Seller\",\"email\":\"$SELLER_EMAIL\",\"phone\":\"$SELLER_PHONE\",\"password\":\"$PASSWORD\",\"role\":\"SELLER\",\"city\":\"Harare\"}" >/dev/null

  local csrf
  csrf=$(login_with_csrf "$SELLER_EMAIL" "$COOKIE_SELLER")

  for consent in TERMS PRIVACY SELLER_RULES NO_SIDE_DEAL; do
    curl -fsS -X POST "$API_BASE/me/consents" \
      -b "$COOKIE_SELLER" \
      -H "X-CSRF-Token: $csrf" \
      -H 'Content-Type: application/json' \
      -d "{\"consentType\":\"$consent\",\"version\":\"1.0.0\",\"accepted\":true}" >/dev/null
  done

  echo "$csrf"
}

create_submitted_listing() {
  local csrf=$1
  local listing_json listing_id image_presign image_url image_key document_presign document_url document_key

  listing_json=$(curl -fsS -X POST "$API_BASE/listings" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d '{"make":"Toyota","model":"Hilux","year":2021,"bodyType":"BAKKIE","colour":"White","fuelType":"DIESEL","transmission":"MANUAL","driveType":"4WD","engineCapacity":"2.8L","mileageKm":123000,"condition":"GOOD","hasAccidentHistory":false,"askPriceUsd":19500,"negotiable":true}')

  listing_id=$(printf '%s' "$listing_json" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).id)')

  image_presign=$(curl -fsS -X POST "$API_BASE/storage/images/presign" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d "{\"slot\":\"FRONT_THREE_QUARTER\",\"contentType\":\"image/jpeg\",\"contentLength\":$IMAGE_LEN}")
  image_url=$(printf '%s' "$image_presign" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).uploadUrl)')
  image_key=$(printf '%s' "$image_presign" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).storageKey)')
  curl -fsS -X PUT -H 'Content-Type: image/jpeg' --upload-file "$IMAGE_FILE" "$image_url" >/dev/null
  curl -fsS -X POST "$API_BASE/listings/$listing_id/images" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d "{\"storageKey\":\"$image_key\",\"slot\":\"FRONT_THREE_QUARTER\",\"isCover\":true}" >/dev/null

  document_presign=$(curl -fsS -X POST "$API_BASE/storage/documents/presign" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d "{\"documentType\":\"REGISTRATION_BOOK\",\"contentType\":\"application/pdf\",\"contentLength\":$PDF_LEN}")
  document_url=$(printf '%s' "$document_presign" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).uploadUrl)')
  document_key=$(printf '%s' "$document_presign" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).storageKey)')
  curl -fsS -X PUT -H 'Content-Type: application/pdf' --upload-file "$PDF_FILE" "$document_url" >/dev/null
  curl -fsS -X POST "$API_BASE/listings/$listing_id/documents" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d "{\"storageKey\":\"$document_key\",\"documentType\":\"REGISTRATION_BOOK\"}" >/dev/null

  curl -fsS -X POST "$API_BASE/listings/$listing_id/submit" \
    -b "$COOKIE_SELLER" \
    -H "X-CSRF-Token: $csrf" \
    -H 'Content-Type: application/json' \
    -d '{"sellerDisclosure":"Prepared for Phase 5 fixture."}' >/dev/null

  echo "$listing_id"
}

ADMIN_ID=$(insert_user "$ADMIN_EMAIL" "$ADMIN_PHONE" "Phase 4 Admin" "Harare" "ADMIN")
INSPECTOR_ID=$(insert_user "$INSPECTOR_EMAIL" "$INSPECTOR_PHONE" "Phase 4 Inspector" "Harare" "INSPECTOR")

SELLER_CSRF=$(register_seller)
ADMIN_CSRF=$(login_with_csrf "$ADMIN_EMAIL" "$COOKIE_ADMIN")
INSPECTOR_CSRF=$(login_with_csrf "$INSPECTOR_EMAIL" "$COOKIE_INSPECTOR")
LISTING_ID=$(create_submitted_listing "$SELLER_CSRF")

curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/ownership-verification" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"status":"IN_REVIEW","note":"Initial ownership review."}' >/dev/null

TASK_JSON=$(curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/inspection-tasks" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
  -H 'Content-Type: application/json' \
  -d "{\"inspectorId\":\"$INSPECTOR_ID\",\"scheduledAt\":\"2026-06-09T08:00:00.000Z\",\"locationNote\":\"Seed fixture\"}")
TASK_ID=$(printf '%s' "$TASK_JSON" | node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync(0, "utf8")).id)')

curl -fsS -X POST "$API_BASE/inspectors/inspection-tasks/$TASK_ID/report" \
  -b "$COOKIE_INSPECTOR" \
  -H "X-CSRF-Token: $INSPECTOR_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"findings":[{"category":"ENGINE","label":"Oil level","rating":"PASS","note":"Within range"},{"category":"ELECTRICAL","label":"Air conditioning","rating":"WATCH","note":"Cooling weaker than expected"}],"inspectorNote":"Vehicle is in good condition overall.","roadworthy":true}' >/dev/null

curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/ownership-verification" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"status":"APPROVED","note":"Ownership verified."}' >/dev/null

curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/inspection-summary/approve" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"buyerNote":"Independent inspection complete."}' >/dev/null

curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/approve" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" >/dev/null

curl -fsS -X POST "$API_BASE/admin/listings/$LISTING_ID/publish" \
  -b "$COOKIE_ADMIN" \
  -H "X-CSRF-Token: $ADMIN_CSRF" >/dev/null

echo "Published listing seeded: $LISTING_ID"
