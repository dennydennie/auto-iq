#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
API_ORIGIN="${1:-${LIVE_API_ORIGIN:-}}"
AAB="$MOBILE_DIR/build/app/outputs/bundle/release/app-release.aab"
MANIFEST="$MOBILE_DIR/build/app/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml"
PACKAGE_NAME="zw.co.bisell.autoiq.mobile"
VERSION_NAME="$(awk '/^version:/ {print $2}' "$MOBILE_DIR/pubspec.yaml" | cut -d+ -f1)"
COMMIT_SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"

require_value() {
  if [ -z "${!1:-}" ]; then
    echo "Missing required environment variable: $1" >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

if [[ ! "$API_ORIGIN" =~ ^https:// ]] || [[ "$API_ORIGIN" =~ (staging|localhost|example|invalid) ]]; then
  echo "A production HTTPS API origin is required." >&2
  exit 1
fi
API_ORIGIN="${API_ORIGIN%/}"

require_value AUTO_IQ_ANDROID_KEYSTORE_PATH
require_value AUTO_IQ_ANDROID_KEYSTORE_PASSWORD
require_value AUTO_IQ_ANDROID_KEY_ALIAS
require_value AUTO_IQ_ANDROID_KEY_PASSWORD
require_command flutter
require_command keytool
require_command node
require_command unzip

node "$ROOT_DIR/scripts/mobile/assert-committed-source.mjs"
cd "$MOBILE_DIR"
flutter pub get --enforce-lockfile
flutter build appbundle --release \
  --dart-define=AUTO_IQ_API_BASE_URL="$API_ORIGIN" \
  --dart-define=AUTO_IQ_SENTRY_DSN="${AUTO_IQ_SENTRY_DSN:-}" \
  --dart-define=AUTO_IQ_SENTRY_ENVIRONMENT="${AUTO_IQ_SENTRY_ENVIRONMENT:-production}" \
  --dart-define=AUTO_IQ_SENTRY_RELEASE="${AUTO_IQ_SENTRY_RELEASE:-mobile@$COMMIT_SHA}"

node "$ROOT_DIR/scripts/mobile/assert-play-bundle.mjs" \
  "$AAB" "$MANIFEST" "$PACKAGE_NAME" "$VERSION_NAME" "$API_ORIGIN"

echo "Play bundle: $AAB"
echo "SHA-256: $(shasum -a 256 "$AAB" | awk '{print $1}')"
