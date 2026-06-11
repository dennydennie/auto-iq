# Phase 8: Production Deployment

| | |
| --- | --- |
| **Goal** | Deploy `apps/api` on **Railway** with **Tigris** and **Railway Redis/Postgres**. |
| **Depends on** | [07-hardening](../07-hardening/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) / [testing.md](./testing.md) |

## Platform (locked)

| Component | Provider |
| --- | --- |
| API | Railway |
| PostgreSQL | Railway plugin |
| Redis | Railway plugin |
| Object storage | Tigris |

## Railway layout

Project with `staging` and `production` environments: `api`, Postgres, Redis, Tigris bucket per env.

## Tasks

- [x] Dockerfile / Railpack; release command for migrations (`node scripts/run-migrations.js` using the compiled TypeORM datasource)
- [x] Railway variables: `DATABASE_URL`, `REDIS_URL`, Tigris `AWS_*`, `SENTRY_*`, secrets
- [x] Health check `/api/v1/health/ready`
- [x] Staging auto-deploy; production manual promote documented in [deployment-railway.md](../../../operations/deployment-railway.md)
- [x] Rollback procedure documented in [deployment-railway.md](../../../operations/deployment-railway.md)
- [x] Go-live checklist created in [go-live-checklist.md](../../../operations/go-live-checklist.md)
- [ ] Go-live checklist executed

See full variable table and checklists in original platform sections below.

## Rollout gates

User-requested phases 9-10 are treated as production rollout, rollback, and go-live gates because this plan set ends at Phase 8.

| Gate | Owner | Required evidence |
| --- | --- | --- |
| Gate 8A - staging deploy | Engineering | Railway `staging` auto-deploys from the agreed branch, migrations complete, readiness is green, and staging smoke results are attached to the release note. |
| Gate 8B - rollback rehearsal | Engineering + Ops | A staging rollback to the previous healthy Railway deployment is tested once and `scripts/smoke-remote.sh` passes afterward. |
| Gate 8C - production promote | Engineering lead | Production promote is manual from the same Git SHA that passed staging and CI; no direct unverified production deploys. |
| Gate 8D - go-live | Product + Ops | [Go-live checklist](../../../operations/go-live-checklist.md) is complete, production smoke passes, and 30-60 minute monitoring shows no sustained 5xx spike. |

## Configuration

| Variable | Source |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `AWS_*` / `BUCKET_NAME` | Tigris |
| `SENTRY_DSN` | Sentry project |
| `SENTRY_ENVIRONMENT` | `staging` / `production` |
| `SENTRY_RELEASE` | Git SHA |
| `SESSION_SECRET` | Railway secret |
| `JWT_SECRET` | Railway secret only if future non-browser JWT support is enabled |
| `CORS_ORIGINS` | Production web URL |

## Tigris prefixes

- `public-listing-images/`
- `private-seller-documents/`
- `inspection-reports/`

Local dev remains MinIO per [03-seller-listings](../03-seller-listings/plan.md).

## Scaling

- 2+ replicas when budget allows; Redis required for shared session/OTP
- Graceful `SIGTERM` handling

## After MVP

Deferred: WhatsApp, TIDA, payments - separate plans.
