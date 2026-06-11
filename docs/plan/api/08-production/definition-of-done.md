# Phase 8 — Definition of Done

## Staging

- [ ] Railway `staging` deploys from `main` (or agreed branch)
- [ ] Migrations run via release command without error
- [ ] `/api/v1/health/ready` green (Postgres and Redis)
- [ ] [testing.md](./testing.md) staging smoke suite passed
- [ ] Rollback to previous Railway deployment tested once on staging

## Production

- [ ] Production environment variables set (no staging URLs/keys)
- [ ] Custom domain or Railway URL serving `/api/v1`
- [ ] Cookie domain, SameSite, Secure, CORS, credentials, and CSRF verified against real web origin
- [ ] Sentry `production` environment receiving releases
- [ ] Postgres backup enabled; post-deploy backup verified
- [ ] Go-live checklist in [plan.md](./plan.md) completed
- [ ] 30–60 min post-deploy monitoring with no sustained 5xx spike

## Documentation

- [ ] ADR or ops note: Railway project id, service names, Tigris bucket names
- [ ] On-call and escalation linked

## Sign-off

| Role | Confirms |
| --- | --- |
| Engineering lead | Deploy + rollback |
| Product | MVP launch acceptance |
| Ops | Backups, alerts, runbooks |

## SLO (starting point)

- Availability target agreed (e.g. 99.5%) — measure after 2 weeks baseline
