#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENVIRONMENT_NAME="${RAILWAY_ENVIRONMENT_NAME:-staging}"
WEB_SERVICE="${RAILWAY_WEB_SERVICE:-web}"
BUCKET_SERVICE="${RAILWAY_BUCKET_NAME:-assets}"
DEPLOY_MESSAGE="${RAILWAY_DEPLOY_MESSAGE:-Deploy ${WEB_SERVICE} from CLI}"
PROJECT_ID="${RAILWAY_PROJECT_ID:-}"
TMP_DIR=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

log_step() {
  printf '\n==> %s\n' "$1"
}

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}

resolve_project_id() {
  if [ -n "$PROJECT_ID" ]; then
    printf '%s\n' "$PROJECT_ID"
    return
  fi

  railway status --json | node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
if (!payload.id) {
  process.exit(1);
}
process.stdout.write(payload.id);
'
}

stage_file() {
  local path=$1
  mkdir -p "$(dirname "$TMP_DIR/$path")"
  cp "$ROOT_DIR/$path" "$TMP_DIR/$path"
}

stage_tree() {
  local source=$1
  shift

  tar -C "$ROOT_DIR" "$@" -cf - "$source" | tar -C "$TMP_DIR" -xf -
}

write_railway_config() {
  cat >"$TMP_DIR/railway.json" <<'EOF'
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
}

create_bundle() {
  TMP_DIR="$(mktemp -d)"
  trap cleanup EXIT

  stage_file "Dockerfile"
  stage_file ".dockerignore"
  stage_file "package.json"
  stage_file "pnpm-lock.yaml"
  stage_file "pnpm-workspace.yaml"
  stage_file "turbo.json"
  stage_tree "apps/web" \
    --exclude "apps/web/.DS_Store" \
    --exclude "apps/web/.next" \
    --exclude "apps/web/.turbo" \
    --exclude "apps/web/node_modules" \
    --exclude "apps/web/tsconfig.tsbuildinfo"
  stage_tree "packages/contracts" --exclude "packages/contracts/node_modules"
  write_railway_config
}

deploy_bundle() {
  local project_id
  project_id="$(resolve_project_id)"
  local args=("$TMP_DIR" "--path-as-root" "--project" "$project_id" "--service" "$WEB_SERVICE" "--environment" "$ENVIRONMENT_NAME" "--ci" "--verbose" "--message" "$DEPLOY_MESSAGE")

  railway up "${args[@]}"
}

configure_storage_variables() {
  railway variable set "STORAGE_ENDPOINT=\${{${BUCKET_SERVICE}.ENDPOINT}}" \
    --service "$WEB_SERVICE" \
    --environment "$ENVIRONMENT_NAME" \
    --skip-deploys >/dev/null
  railway variable set "STORAGE_FORCE_PATH_STYLE=false" \
    --service "$WEB_SERVICE" \
    --environment "$ENVIRONMENT_NAME" \
    --skip-deploys >/dev/null
}

main() {
  require_command railway
  require_command tar

  log_step "Checking Railway authentication"
  railway whoami >/dev/null

  log_step "Preparing web deploy bundle"
  create_bundle

  log_step "Configuring private storage image host"
  configure_storage_variables

  log_step "Deploying web service"
  deploy_bundle
}

main "$@"
