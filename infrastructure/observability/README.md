# Observability

Phase 7/8 baseline:

- Sentry DSNs per environment: `auto-iq-api-staging`, `auto-iq-api-production`
- Required env:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_RELEASE`
- Structured request/error logs are JSON on stdout.
- Correlation IDs are generated at ingress when absent and echoed as `X-Correlation-Id`.

## Alert starter set

- New or regressed Sentry issue in `production`
- 5xx spike above 1% for 5 minutes
- Readiness failing for 1 minute
- Notification failure spike (`FAILED` / `DEAD_LETTER`)

## Release checks

- Run `pnpm --filter api openapi:export`
- Run `scripts/smoke-remote.sh` against staging before production promote
- Keep runbooks in `docs/operations/` aligned with the deployed environment
