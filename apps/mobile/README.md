# Auto IQ Mobile

The Android app is now wired against the Nest API for buyer and seller flows:

- session-cookie auth with CSRF handling
- buyer catalogue, saved vehicles, quotes, sourcing requests, and viewings
- seller dashboard, profile, listing creation, media upload, and submission

## Local runtime

Start the backend stack from the repo root:

```bash
./scripts/dev/start-mobile-stack.sh
```

That script builds the API container, starts Postgres, Redis, MinIO, runs migrations, and seeds a published listing for the mobile browse flow.

## Run on Android emulator

From `apps/mobile`:

```bash
flutter pub get
flutter run --dart-define=AUTO_IQ_API_BASE_URL=http://10.0.2.2:4000 -d emulator-5554
```

If `AUTO_IQ_API_PORT` was overridden when starting Docker, use that port in the `AUTO_IQ_API_BASE_URL` define.

`AUTO_IQ_API_BASE_URL` should be the API origin, not the versioned path. For example use `https://auto-iq-api.up.railway.app`, not `https://auto-iq-api.up.railway.app/api/v1`.

## Sentry crash reporting

The mobile app uses `sentry_flutter` for Dart, Flutter, Android, and iOS crashes. It is disabled when no DSN is supplied. Pass configuration at build time so credentials never enter source control:

```bash
flutter run \
  --dart-define=AUTO_IQ_API_BASE_URL=http://10.0.2.2:4000 \
  --dart-define=AUTO_IQ_SENTRY_DSN="$AUTO_IQ_SENTRY_DSN" \
  --dart-define=AUTO_IQ_SENTRY_ENVIRONMENT=development \
  --dart-define=AUTO_IQ_SENTRY_RELEASE=mobile@local
```

The release helper forwards the same three `AUTO_IQ_SENTRY_*` environment variables when `AUTO_IQ_SENTRY_DSN` is present. Default PII and request bodies are disabled. A real staging event and native symbol upload remain deployment evidence; do not record a successful Sentry smoke until the event appears in the configured project.

## Google Play bundle

Production Android builds require a dedicated upload key. Keep the keystore and
passwords outside Git and provide them through these environment variables:

```bash
export AUTO_IQ_ANDROID_KEYSTORE_PATH=/secure/path/autoiq-upload.jks
export AUTO_IQ_ANDROID_KEYSTORE_PASSWORD='...'
export AUTO_IQ_ANDROID_KEY_ALIAS=autoiq-upload
export AUTO_IQ_ANDROID_KEY_PASSWORD='...'
./scripts/mobile/build-play-bundle.sh https://api-production-af6d.up.railway.app
```

The Play builder rejects staging, local, and placeholder API origins. It also
checks the package, version, target SDK, cleartext policy, arm64 binary, API
origin, account-deletion route, and signing certificate before reporting a
successful artifact.

The Railway production origin was verified through both API health endpoints on
12 August 2026. Store screenshots are under
`apps/mobile/store-listing/screenshots`; they are rendered from the production
Flutter widgets at 1080 × 1920 without using production customer records.
