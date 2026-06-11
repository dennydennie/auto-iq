# Go-Live Checklist

Use this checklist as the Phase 8 production gate. User-requested phases 9-10 map to this rollout, rollback, and go-live control point.

## Release identity

| Item | Value |
| --- | --- |
| Release Git SHA | |
| Railway project | |
| Staging environment | |
| Production environment | |
| API production origin | |
| Web production origin | |
| Sentry release | |
| Decision log / ticket | |

## Gate 1 - staging auto-deploy

- [ ] Staging Railway environment deploys automatically from the agreed branch.
- [ ] Release command completed migrations without manual database changes.
- [ ] `GET /api/v1/health/live` returned 200.
- [ ] `GET /api/v1/health/ready` returned 200 with Postgres and Redis up.
- [ ] `scripts/smoke-remote.sh` passed against staging.
- [ ] Tigris presign upload/register path passed in staging.
- [ ] Controlled Sentry event was received with `environment=staging` and the release SHA.

## Gate 2 - rollback rehearsal

- [ ] Previous healthy Railway deployment was identified before production promote.
- [ ] Staging rollback was tested once for this launch window.
- [ ] Readiness returned 200 within 5 minutes after rollback.
- [ ] Staging smoke passed after rollback.
- [ ] Migration compatibility risk was reviewed; irreversible migrations have a restore plan.

## Gate 3 - production manual promote

- [ ] Production promote uses the same Git SHA that passed staging.
- [ ] Production environment variables contain only production URLs, keys, and cookie domains.
- [ ] `SESSION_COOKIE_SECURE=true` and browser cookie behavior are verified against the real web origin.
- [ ] CORS allow-list contains exact production origins only.
- [ ] CSRF-protected mutation succeeds from the production web origin.
- [ ] Postgres backup is enabled and the latest backup timestamp is recorded.
- [ ] On-call owner and escalation path are known before promote.

## Gate 4 - production smoke

- [ ] `GET /api/v1/health/live` returned 200.
- [ ] `GET /api/v1/health/ready` returned 200.
- [ ] Read-only catalogue smoke passed.
- [ ] Auth smoke passed with the smoke user.
- [ ] Admin dashboard smoke passed with the admin smoke user.
- [ ] Sentry shows the production release and no untriaged launch-blocking issue.

## Gate 5 - post-launch monitor

- [ ] Monitor for 30-60 minutes after production promote.
- [ ] No sustained 5xx spike; use [5xx-spike.md](./5xx-spike.md) if triggered.
- [ ] Postgres, Redis, and API latency are within the expected baseline.
- [ ] Error budget / availability target is recorded for the launch window.
- [ ] Product confirms MVP launch acceptance.

## Final sign-off

| Role | Name | Time | Notes |
| --- | --- | --- | --- |
| Engineering lead | | | |
| Product | | | |
| Ops / on-call | | | |
