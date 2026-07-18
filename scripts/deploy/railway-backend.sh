#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROJECT_NAME="${RAILWAY_PROJECT_NAME:-auto-iq}"
ENVIRONMENT_NAME="${RAILWAY_ENVIRONMENT_NAME:-production}"
WORKSPACE_NAME="${RAILWAY_WORKSPACE_NAME:-}"
POSTGRES_SERVICE="${RAILWAY_POSTGRES_SERVICE:-postgres}"
REDIS_SERVICE="${RAILWAY_REDIS_SERVICE:-redis}"
API_SERVICE="${RAILWAY_API_SERVICE:-api}"
BUCKET_NAME="${RAILWAY_BUCKET_NAME:-assets}"
BUCKET_REGION="${RAILWAY_BUCKET_REGION:-auto}"
WEB_BASE_URL="${WEB_BASE_URL:-}"
CORS_ORIGINS="${CORS_ORIGINS:-$WEB_BASE_URL}"
SESSION_SECRET_VALUE="${SESSION_SECRET_VALUE:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"
RUN_ID="${RUN_ID:-railway$(date +%s)}"
SENTRY_DSN="${SENTRY_DSN:-}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

log_step() {
  printf '\n==> %s\n' "$1"
}

normalize_origin() {
  local value=${1%/}
  if [[ "$value" == */api/v1 ]]; then
    value=${value%/api/v1}
  fi
  printf '%s\n' "$value"
}

require_public_web_origin() {
  if [[ ! "$WEB_BASE_URL" =~ ^https:// ]] || [[ "$WEB_BASE_URL" == *localhost* ]]; then
    echo "WEB_BASE_URL must be set to the public HTTPS web origin before production deploy." >&2
    exit 1
  fi
}

railway_cmd() {
  railway "$@"
}

ensure_logged_in() {
  railway_cmd whoami >/dev/null
}

link_or_create_project() {
  local link_args=()
  local init_args=(--name "$PROJECT_NAME")

  if [ -n "$WORKSPACE_NAME" ]; then
    link_args+=(--workspace "$WORKSPACE_NAME")
    init_args+=(--workspace "$WORKSPACE_NAME")
  fi

  if railway_cmd link "${link_args[@]}" --project "$PROJECT_NAME" >/dev/null 2>&1; then
    return
  fi

  railway_cmd init "${init_args[@]}" >/dev/null
}

ensure_environment() {
  if railway_cmd environment link "$ENVIRONMENT_NAME" >/dev/null 2>&1; then
    return
  fi

  if ! railway_cmd environment new "$ENVIRONMENT_NAME" >/dev/null 2>&1; then
    railway_cmd environment list >/dev/null
  fi

  railway_cmd environment link "$ENVIRONMENT_NAME" >/dev/null
}

ensure_service() {
  local service_name=$1
  local service_type=${2:-service}

  if railway_cmd service link "$service_name" >/dev/null 2>&1; then
    return
  fi

  if [ "$service_type" = "postgres" ] || [ "$service_type" = "redis" ]; then
    railway_cmd add --database "$service_type" --service "$service_name" >/dev/null
  else
    railway_cmd add --service "$service_name" >/dev/null
  fi

  railway_cmd service link "$service_name" >/dev/null
}

ensure_bucket() {
  if railway_cmd bucket info --bucket "$BUCKET_NAME" --environment "$ENVIRONMENT_NAME" >/dev/null 2>&1; then
    return
  fi

  railway_cmd bucket create "$BUCKET_NAME" --region "$BUCKET_REGION" --environment "$ENVIRONMENT_NAME" >/dev/null
}

set_variable() {
  local service_name=$1
  local key=$2
  local value=$3
  railway_cmd variable set "${key}=${value}" \
    --service "$service_name" \
    --environment "$ENVIRONMENT_NAME" \
    --skip-deploys >/dev/null
}

set_secret_variable() {
  local service_name=$1
  local key=$2
  local value=$3
  printf '%s' "$value" | railway_cmd variable set "$key" \
    --stdin \
    --service "$service_name" \
    --environment "$ENVIRONMENT_NAME" \
    --skip-deploys >/dev/null
}

ensure_session_secret() {
  if [ -n "$SESSION_SECRET_VALUE" ]; then
    printf '%s\n' "$SESSION_SECRET_VALUE"
    return
  fi

  node -e "const crypto=require('node:crypto'); process.stdout.write(crypto.randomBytes(48).toString('base64url'));"
}

ensure_smoke_password() {
  if [ -n "$SMOKE_PASSWORD" ]; then
    printf '%s\n' "$SMOKE_PASSWORD"
    return
  fi

  node -e "const crypto=require('node:crypto'); process.stdout.write(\`AutoIQ!\${crypto.randomBytes(6).toString('base64url')}9\`);"
}

extract_public_domain() {
  node -e '
const fs = require("node:fs");
const value = JSON.parse(fs.readFileSync(0, "utf8"));
const queue = [value];
while (queue.length > 0) {
  const current = queue.shift();
  if (!current) continue;
  if (typeof current === "string" && /\.up\.railway\.app$/i.test(current)) {
    process.stdout.write(current);
    process.exit(0);
  }
  if (Array.isArray(current)) {
    queue.push(...current);
    continue;
  }
  if (typeof current === "object") {
    queue.push(...Object.values(current));
  }
}
process.exit(1);
'
}

configure_api_variables() {
  local session_secret=$1

  set_variable "$API_SERVICE" "NODE_ENV" "production"
  set_variable "$API_SERVICE" "DATABASE_URL" "\${{${POSTGRES_SERVICE}.DATABASE_URL}}"
  set_variable "$API_SERVICE" "DATABASE_SSL" "true"
  set_variable "$API_SERVICE" "DATABASE_SSL_SERVER_NAME" "localhost"
  set_variable "$API_SERVICE" "REDIS_URL" "\${{${REDIS_SERVICE}.REDIS_URL}}"
  set_variable "$API_SERVICE" "CORS_ORIGINS" "$CORS_ORIGINS"
  set_variable "$API_SERVICE" "WEB_BASE_URL" "$WEB_BASE_URL"
  set_variable "$API_SERVICE" "CSRF_COOKIE_NAME" "auto_iq_csrf"
  set_variable "$API_SERVICE" "CSRF_HEADER_NAME" "x-csrf-token"
  set_variable "$API_SERVICE" "SESSION_COOKIE_NAME" "auto_iq_session"
  set_variable "$API_SERVICE" "SESSION_COOKIE_SAME_SITE" "lax"
  set_variable "$API_SERVICE" "SESSION_COOKIE_SECURE" "true"
  set_secret_variable "$API_SERVICE" "SESSION_SECRET" "$session_secret"
  set_variable "$API_SERVICE" "STORAGE_ENDPOINT" "\${{${BUCKET_NAME}.ENDPOINT}}"
  set_variable "$API_SERVICE" "STORAGE_REGION" "\${{${BUCKET_NAME}.REGION}}"
  set_variable "$API_SERVICE" "STORAGE_ACCESS_KEY" "\${{${BUCKET_NAME}.ACCESS_KEY_ID}}"
  set_variable "$API_SERVICE" "STORAGE_SECRET_KEY" "\${{${BUCKET_NAME}.SECRET_ACCESS_KEY}}"
  set_variable "$API_SERVICE" "STORAGE_BUCKET" "\${{${BUCKET_NAME}.BUCKET}}"
  set_variable "$API_SERVICE" "AWS_ENDPOINT_URL_S3" "\${{${BUCKET_NAME}.ENDPOINT}}"
  set_variable "$API_SERVICE" "AWS_ENDPOINT_URL" "\${{${BUCKET_NAME}.ENDPOINT}}"
  set_variable "$API_SERVICE" "AWS_REGION" "\${{${BUCKET_NAME}.REGION}}"
  set_variable "$API_SERVICE" "AWS_DEFAULT_REGION" "\${{${BUCKET_NAME}.REGION}}"
  set_variable "$API_SERVICE" "AWS_ACCESS_KEY_ID" "\${{${BUCKET_NAME}.ACCESS_KEY_ID}}"
  set_variable "$API_SERVICE" "AWS_SECRET_ACCESS_KEY" "\${{${BUCKET_NAME}.SECRET_ACCESS_KEY}}"
  set_variable "$API_SERVICE" "AWS_S3_BUCKET_NAME" "\${{${BUCKET_NAME}.BUCKET}}"
  set_variable "$API_SERVICE" "BUCKET_NAME" "\${{${BUCKET_NAME}.BUCKET}}"
  set_variable "$API_SERVICE" "AWS_S3_URL_STYLE" "virtual"
  set_variable "$API_SERVICE" "STORAGE_FORCE_PATH_STYLE" "false"
  set_variable "$API_SERVICE" "STORAGE_PRESIGN_TTL_SECONDS" "900"
  set_variable "$API_SERVICE" "SWAGGER_ENABLED" "false"
  set_variable "$API_SERVICE" "ENABLE_TEST_ERROR_ROUTE" "false"
  set_variable "$API_SERVICE" "SENTRY_ENVIRONMENT" "$ENVIRONMENT_NAME"
  set_variable "$API_SERVICE" "SENTRY_RELEASE" "\${{RAILWAY_GIT_COMMIT_SHA}}"

  if [ -n "$SENTRY_DSN" ]; then
    set_secret_variable "$API_SERVICE" "SENTRY_DSN" "$SENTRY_DSN"
  fi
}

deploy_api() {
  railway_cmd up "$ROOT_DIR" \
    --service "$API_SERVICE" \
    --environment "$ENVIRONMENT_NAME" \
    --path-as-root \
    --message "Deploy ${API_SERVICE} from CLI"
}

ensure_public_domain() {
  local domain_json
  domain_json="$(railway_cmd domain --service "$API_SERVICE" --environment "$ENVIRONMENT_NAME" --json)"
  printf '%s' "$domain_json" | extract_public_domain
}

seed_demo_data() {
  local api_origin=$1
  API_BASE="${api_origin}/api/v1" \
  PASSWORD="$SMOKE_PASSWORD" \
  RUN_ID="$RUN_ID" \
  railway_cmd run \
    --service "$API_SERVICE" \
    --environment "$ENVIRONMENT_NAME" \
    -- pnpm --filter api exec node scripts/seed-mobile-demo.mjs
}

main() {
  require_command railway
  require_command node
  require_command pnpm
  require_public_web_origin

  log_step "Checking Railway authentication"
  ensure_logged_in

  log_step "Linking or creating Railway project"
  link_or_create_project
  ensure_environment

  log_step "Ensuring project services"
  ensure_service "$API_SERVICE" service
  ensure_service "$POSTGRES_SERVICE" postgres
  ensure_service "$REDIS_SERVICE" redis
  ensure_bucket
  railway_cmd service link "$API_SERVICE" >/dev/null

  log_step "Configuring API variables"
  configure_api_variables "$(ensure_session_secret)"

  local smoke_password
  smoke_password="$(ensure_smoke_password)"
  SMOKE_PASSWORD="$smoke_password"

  log_step "Deploying API service"
  deploy_api

  log_step "Creating Railway public domain"
  local public_domain
  public_domain="$(ensure_public_domain)"
  local api_origin
  api_origin="$(normalize_origin "https://${public_domain}")"

  log_step "Seeding live demo data"
  local seed_output_raw
  seed_output_raw="$(seed_demo_data "$api_origin")"
  local seed_output
  seed_output="$(printf '%s\n' "$seed_output_raw" | tail -n 1)"

  log_step "Running remote smoke checks"
  API_BASE="${api_origin}/api/v1" \
  SMOKE_PASSWORD="$smoke_password" \
  SMOKE_EMAIL="$(printf '%s' "$seed_output" | node -e 'const fs=require("node:fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(data.users.seller);')" \
  ADMIN_EMAIL="$(printf '%s' "$seed_output" | node -e 'const fs=require("node:fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(data.users.admin);')" \
  ADMIN_PASSWORD="$smoke_password" \
  "$ROOT_DIR/scripts/smoke-remote.sh"

  printf '\nAPI_ORIGIN=%s\n' "$api_origin"
  printf 'SEED_RESULT=%s\n' "$seed_output"
}

main "$@"
