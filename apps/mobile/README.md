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
