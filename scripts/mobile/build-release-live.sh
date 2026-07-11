#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
LIVE_API_ORIGIN="${1:-${LIVE_API_ORIGIN:-}}"
SOURCE_CHECK="$ROOT_DIR/scripts/mobile/assert-committed-source.mjs"

if [ -z "$LIVE_API_ORIGIN" ]; then
  echo "Usage: $0 <live-api-origin>" >&2
  echo "Example: $0 https://auto-iq-api.up.railway.app" >&2
  exit 1
fi

normalize_origin() {
  local value=${1%/}
  if [[ "$value" == */api/v1 ]]; then
    value=${value%/api/v1}
  fi
  printf '%s\n' "$value"
}

API_ORIGIN="$(normalize_origin "$LIVE_API_ORIGIN")"

node "$SOURCE_CHECK"
cd "$MOBILE_DIR"
flutter pub get --enforce-lockfile
node "$SOURCE_CHECK"
flutter build apk \
  --release \
  --dart-define=AUTO_IQ_API_BASE_URL="$API_ORIGIN"

COMMIT_SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"
BRANCH="$(git -C "$ROOT_DIR" symbolic-ref --short HEAD)"
APK="$MOBILE_DIR/build/app/outputs/flutter-apk/app-release.apk"
APK_SHA256="$(shasum -a 256 "$APK" | awk '{print $1}')"

echo
echo "Release APK built for $API_ORIGIN"
echo "Source: $BRANCH $COMMIT_SHA"
echo "Artifact: $APK"
echo "SHA-256: $APK_SHA256"
