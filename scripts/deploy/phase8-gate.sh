#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  printf 'phase8-gate: %s\n' "$1" >&2
  exit 1
}

require_file() {
  local file=$1
  [ -f "$ROOT_DIR/$file" ] || fail "missing $file"
}

require_text() {
  local file=$1
  local text=$2
  grep -Fq "$text" "$ROOT_DIR/$file" || fail "$file missing: $text"
}

require_railway_config() {
  node - "$ROOT_DIR/railway.json" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
const deploy = config.deploy ?? {};
if (deploy.preDeployCommand !== 'node apps/api/scripts/run-migrations.js') {
  throw new Error('railway.json must run migrations before deploy');
}
if (deploy.healthcheckPath !== '/api/v1/health/ready') {
  throw new Error('railway.json must use readiness healthcheck');
}
NODE
}

main() {
  require_file "docs/plan/api/08-production/plan.md"
  require_file "docs/plan/api/08-production/definition-of-done.md"
  require_file "docs/plan/api/08-production/testing.md"
  require_file "docs/operations/deployment-railway.md"
  require_file "docs/operations/go-live-checklist.md"
  require_file "scripts/smoke-remote.sh"
  require_file "railway.json"

  require_text "docs/operations/deployment-railway.md" "Staging auto-deploy"
  require_text "docs/operations/deployment-railway.md" "Production manual promote"
  require_text "docs/operations/deployment-railway.md" "Rollback"
  require_text "docs/operations/go-live-checklist.md" "production manual promote"
  require_text "docs/plan/api/08-production/plan.md" "Rollout gates"
  require_railway_config

  printf 'phase8-gate: ok\n'
}

main "$@"
