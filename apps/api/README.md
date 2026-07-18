# auto-iq API

## Purpose

`apps/api` is the NestJS backend for authentication, listings, admin operations, storage, notifications, and other `auto-iq` platform APIs.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm --filter api build
pnpm --filter api start
```

For local infrastructure, use the database and Redis services documented in `infrastructure/database/docker-compose.yml`.

## Required environment variables

See the repository `.env.example` for the full template. Production deployment requires, at minimum:

- `DATABASE_URL`
- `DATABASE_SSL`
- `REDIS_URL`
- `CORS_ORIGINS`
- `SESSION_SECRET`
- `CSRF_COOKIE_NAME`
- `CSRF_HEADER_NAME`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_DOMAIN` when cross-subdomain cookies are required
- `SESSION_COOKIE_SAME_SITE`
- `SESSION_COOKIE_SECURE`
- `STORAGE_ENDPOINT` or `AWS_ENDPOINT_URL` / `AWS_ENDPOINT_URL_S3`
- `STORAGE_REGION` or `AWS_REGION` / `AWS_DEFAULT_REGION`
- `STORAGE_ACCESS_KEY` or `AWS_ACCESS_KEY_ID`
- `STORAGE_SECRET_KEY` or `AWS_SECRET_ACCESS_KEY`
- `STORAGE_BUCKET` or `BUCKET_NAME` / `AWS_S3_BUCKET_NAME`
- `STORAGE_FORCE_PATH_STYLE` or `AWS_S3_URL_STYLE=path|virtual`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

When `NODE_ENV` is `staging` or `production`, startup validation also requires:

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SESSION_COOKIE_SECURE=true`

## API summary

- Base path: `/api/v1`
- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready` returns `200` with `{ "status": "ok", "checks": { "db": "up", "redis": "up" } }` when traffic-serving dependencies are healthy, otherwise `503` with the same shape and `"status": "error"`
- Contract export: `pnpm --filter api openapi:export`

## Migrations and release flow

- Create an empty migration shell: `pnpm --filter api migration:create --name=DescribeChange`
- Generate a migration from the current entity diff: `pnpm --filter api migration:generate src/db/migrations/DescribeChange`
- Development migrations: `pnpm --filter api migration:run`
- Production release migrations: `pnpm --filter api migration:run:prod`
- Railway uses `railway.json` `preDeployCommand` with `node apps/api/scripts/run-migrations.js` before the new deployment becomes healthy.
- The release wrapper resolves the compiled migration entrypoint from both the repository layout (`apps/api/dist/...`) and the deployed image layout (`/app/dist/...`).
- CLI migrations require only `DATABASE_URL`, `DATABASE_SSL`, and `NODE_ENV`; runtime-only Redis, storage, cookie, and Sentry variables remain enforced when the Nest application boots.
- The CLI datasource only loads database configuration and migrations; it does not bootstrap the Nest HTTP server or unrelated Redis/S3 runtime modules.

## Test command

```bash
pnpm --filter api test -- --runInBand
pnpm --filter api typecheck
```

## Deployment notes

- Container build: `apps/api/Dockerfile`
- Runtime user: non-root `nestjs`
- Railway deployment procedure: `docs/operations/deployment-railway.md`
- Railway/Tigris storage values can be supplied through either the API `STORAGE_*` names or the native `AWS_*` aliases documented in `.env.example`. Buckets remain private: uploads use presigned PUT URLs and API responses use presigned GET URLs.
- Configure the platform readiness probe to `GET /api/v1/health/ready`; it verifies PostgreSQL and Redis connectivity before the instance should receive traffic.
