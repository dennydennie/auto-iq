# Railway Deployment Notes

## Service shape

- Service: `apps/api`
- Runtime: Docker using [apps/api/Dockerfile](/Users/dennismarumahoko/Documents/GitHub/Auto%20IQ/apps/api/Dockerfile)
- Backing services:
  - Railway Postgres
  - Railway Redis
  - Railway bucket

## One-command deploy

From the repo root:

```bash
./scripts/deploy/railway-backend.sh
```

What it does:

- links or creates one Railway project
- ensures `api`, `postgres`, `redis`, and `assets` exist in the same environment
- applies the API variables using Railway reference variables
- deploys the API with [railway.json](/Users/dennismarumahoko/Documents/GitHub/Auto%20IQ/railway.json)
- creates a Railway public domain for the API
- seeds a published mobile-demo listing into the live environment
- runs [scripts/smoke-remote.sh](/Users/dennismarumahoko/Documents/GitHub/Auto%20IQ/scripts/smoke-remote.sh)

Optional inputs:

- `RAILWAY_PROJECT_NAME`
- `RAILWAY_ENVIRONMENT_NAME`
- `RAILWAY_WORKSPACE_NAME`
- `CORS_ORIGINS`
- `SESSION_SECRET_VALUE`
- `SMOKE_PASSWORD`
- `SENTRY_DSN`

## Required variables

- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_SECRET`
- `CORS_ORIGINS`
- `CSRF_COOKIE_NAME`
- `CSRF_HEADER_NAME`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_DOMAIN` when cross-subdomain cookies are required
- `SESSION_COOKIE_SAME_SITE`
- `SESSION_COOKIE_SECURE`
- `STORAGE_ENDPOINT` or `AWS_ENDPOINT_URL_S3`
- `STORAGE_REGION` or `AWS_REGION`
- `STORAGE_ACCESS_KEY` or `AWS_ACCESS_KEY_ID`
- `STORAGE_SECRET_KEY` or `AWS_SECRET_ACCESS_KEY`
- `STORAGE_BUCKET` or `BUCKET_NAME`
- `STORAGE_FORCE_PATH_STYLE`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

`apps/api` validates these at startup. In `staging` and `production`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, and `SESSION_COOKIE_SECURE=true` are mandatory. The storage layer accepts either the internal `STORAGE_*` names or the Railway/Tigris-native `AWS_*` aliases shown above.

The deploy script provisions these for the API service with Railway reference variables:

- `DATABASE_URL=${{postgres.DATABASE_URL}}`
- `REDIS_URL=${{redis.REDIS_URL}}`
- `STORAGE_ENDPOINT=${{assets.ENDPOINT}}`
- `STORAGE_REGION=${{assets.REGION}}`
- `STORAGE_ACCESS_KEY=${{assets.ACCESS_KEY_ID}}`
- `STORAGE_SECRET_KEY=${{assets.SECRET_ACCESS_KEY}}`
- `STORAGE_BUCKET=${{assets.BUCKET}}`
- `AWS_ENDPOINT_URL_S3=${{assets.ENDPOINT}}`
- `AWS_REGION=${{assets.REGION}}`
- `AWS_ACCESS_KEY_ID=${{assets.ACCESS_KEY_ID}}`
- `AWS_SECRET_ACCESS_KEY=${{assets.SECRET_ACCESS_KEY}}`
- `BUCKET_NAME=${{assets.BUCKET}}`

Recommended secret handling on Railway:

- Set `SESSION_SECRET` as a Railway secret value, never in source control.
- Set `SENTRY_DSN` as a Railway secret value when Sentry is enabled.
- Set `CORS_ORIGINS` to the exact production web origins, comma-separated when multiple origins are required.

## Release command

```bash
node apps/api/scripts/run-migrations.js
```

The repository script remains `pnpm --filter api migration:run:prod`, and Railway executes the same wrapper from either the repository checkout or the runtime image with `node apps/api/scripts/run-migrations.js`. The wrapper resolves the compiled migration entrypoint from either `apps/api/dist/scripts/run-migrations.js` in the repository checkout or `/app/dist/scripts/run-migrations.js` in the deployed image, so the release step stays independent from `ts-node`, the Nest HTTP bootstrap path, and the full repository source tree.

Release-command assumptions:

- `pnpm --filter api build` must run during the Docker build so `dist/config/database.config.js` and compiled migrations exist in the runtime image.
- The migration entrypoint only requires `DATABASE_URL` and optional `DATABASE_SSL`; it imports TypeORM metadata directly and does not start the Nest HTTP server.
- Redis, S3/Tigris, and Swagger-related variables are not needed for the release migration step.

## Pre-promote checks

1. `pnpm --filter api openapi:export`
2. `scripts/smoke-remote.sh` against staging
3. Confirm Railway or the container platform uses `GET /api/v1/health/ready` as the readiness probe. A healthy response is HTTP `200` with `{"status":"ok","checks":{"db":"up","redis":"up"}}`; dependency failures return HTTP `503` with the same shape and no secret details.
4. Sentry smoke via `GET /api/v1/_ops/test-error` only when:
   - `ENABLE_TEST_ERROR_ROUTE=true`
   - `DEBUG_TEST_ERROR_TOKEN` is set
5. Rebuild Android APK for the live API origin:

```bash
./scripts/mobile/build-release-live.sh https://your-api.up.railway.app
```

## Staging auto-deploy

Use Railway `staging` as the only automatic deploy target.

1. Connect the API service to the agreed branch, normally `main`.
2. Keep `railway.json` as the deploy source so migrations run before the new container becomes live.
3. Require `GET /api/v1/health/ready` as the readiness probe.
4. Run `scripts/smoke-remote.sh` with `API_BASE=https://<staging-api>/api/v1`.
5. Record the deployed Git SHA, migration result, smoke output, and Sentry release in the release note.

Staging must pass before production is touched. If staging auto-deploy fails, fix forward on the branch or roll staging back before another production decision.

## Production manual promote

Production deploys are manual gates, not automatic branch deploys.

1. Select the exact Git SHA that passed staging, CI, and the Phase 7 trust workflow.
2. Confirm production variables are not copied from staging: API origin, web origin, cookie domain, Sentry environment, Tigris bucket, and smoke users must all be production-specific.
3. Confirm the latest Railway Postgres backup timestamp.
4. Deploy or promote the API service in the Railway production environment.
5. Run production smoke with `scripts/smoke-remote.sh`.
6. Monitor for 30-60 minutes and follow [5xx-spike.md](./5xx-spike.md) if errors rise.

Use [go-live-checklist.md](./go-live-checklist.md) as the sign-off record.

## Rollback

Rollback is the first response when production health is bad and a fix-forward would exceed the incident window.

### Before promote

1. Identify the last healthy Railway deployment and Git SHA.
2. Confirm whether the release contains destructive or irreversible migrations.
3. Confirm the latest Railway Postgres backup timestamp.
4. Keep the previous mobile/web API origin available until production smoke passes.

### During rollback

1. Roll back to the last healthy Railway deployment.
2. Confirm `GET /api/v1/health/live`.
3. Confirm `GET /api/v1/health/ready`.
4. Re-run `scripts/smoke-remote.sh`.
5. Check Sentry for continued errors tagged with the failed release.
6. Announce the rollback result in the launch channel or incident record.

### Database restore fallback

Use restore only when the application rollback cannot recover service because data was corrupted or an irreversible migration shipped.

1. Stop writes by disabling the API service or blocking traffic.
2. Follow [backup-restore.md](./backup-restore.md) for Railway Postgres restore.
3. Reapply only reviewed, compatible migrations.
4. Run readiness and smoke checks before reopening traffic.
5. Record data-loss risk and affected time window in the incident record.
