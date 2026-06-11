# Phase 7: Hardening and Launch Readiness

| | |
| --- | --- |
| **Goal** | API is secure, observable, fully tested, and operable before production. |
| **Depends on** | Phases 1–6 |
| **Blocks** | [08-production](../08-production/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Security

[security.md](../reference/security.md) — IDOR suite, audit, CORS/CSRF, secrets, private documents.

## Observability

[observability.md](../reference/observability.md) — Sentry production-ready, JSON logs, metrics/alerts, runbooks.

## Tasks

- [x] Full-trust smoke path available in `scripts/dev/phase7-hardening-smoke.sh`
- [x] Contract tests vs `packages/contracts`
- [x] Load smoke scripts available for catalogue + presign/register
- [ ] Migration rollback drill on staging
- [ ] Backup/restore validation
- [x] OpenAPI export reference
- [x] Env reference and on-call runbook path

## Evidence

| Gate | Evidence |
| --- | --- |
| Trust workflow + IDOR/CSRF smoke | `scripts/dev/phase7-hardening-smoke.sh` |
| Contract tests | `apps/api/src/contracts/contracts.phase7.spec.ts`, `apps/api/src/contracts/api-client.spec.ts` |
| Sentry scrub/filter tests | `apps/api/src/common/sentry/sentry-scrubber.spec.ts`, `apps/api/src/common/filters/http-exception.filter.spec.ts` |
| Load smoke scripts | `scripts/load/catalogue-smoke.mjs`, `scripts/load/presign-register-smoke.mjs`, [load-testing.md](../../../operations/load-testing.md) |
| OpenAPI export | `pnpm --filter api openapi:export`, `docs/api/openapi.json` |
| Operations runbooks | [operations](../../../operations/README.md) |

Staging-only gates remain open until run against a real staging environment: Sentry ingestion, migration rollback, backup restore, and production alert enablement.

## Next phase

[08-production/plan.md](../08-production/plan.md)
