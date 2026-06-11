# Phase 7 — Definition of Done

## Security

- [x] IDOR smoke coverage exists for public listing payloads, listing ownership, inspector assignment, unauthenticated admin publish, and missing CSRF
- [ ] `pnpm audit` gate in CI (no critical/high unmitigated)
- [x] CORS, cookie flags, and CSRF enforcement documented and tested for web client at unit/smoke level
- [ ] Private document checklist completed
- [x] Sentry scrubbing covered by unit test
- [ ] No secrets in production image verified against the release image

## Testing

- [x] Full MVP trust workflow smoke script available
- [ ] Contract tests pass for published DTOs in CI/local verification
- [ ] Load test report filed (targets met or accepted risks logged)

## Frontend quality

- [ ] Accessibility checks pass for auth, seller wizard, admin queue, marketplace filters, and viewing scheduler
- [ ] i18n checks pass for externalized strings and locale-aware date/number formatting

## Observability

- [x] Sentry error filtering and header scrubbing have unit coverage
- [ ] Sentry receiving errors in staging with correct tags/release
- [ ] Alert rules configured for staging (production rules ready, can enable at deploy)
- [x] Runbooks in `docs/operations/` for: DB down, 5xx spike, notification failures

## Operations

- [ ] Staging backup restore drill completed once
- [x] Pool sizing and Redis memory documented
- [x] Admin dashboard counts match DB spot-check in Phase 7 smoke script

## Sign-off

| Role | Confirms |
| --- | --- |
| Engineering lead | E2E + security checklist |
| Product | Staging demo of full trust workflow |
| Ops | Runbooks + backup drill |

No open **P0/P1** security defects.

## Evidence references

| Item | Evidence |
| --- | --- |
| Local hardening smoke | `scripts/dev/phase7-hardening-smoke.sh` |
| Contract tests | `apps/api/src/contracts/contracts.phase7.spec.ts`, `apps/api/src/contracts/api-client.spec.ts` |
| Sentry scrub/filter tests | `apps/api/src/common/sentry/sentry-scrubber.spec.ts`, `apps/api/src/common/filters/http-exception.filter.spec.ts` |
| Capacity reference | [capacity-reference.md](../../../operations/capacity-reference.md) |
| Runbooks | [operations](../../../operations/README.md) |

Do not mark staging-only items complete from local evidence. They require captured staging output or an explicit waiver.
