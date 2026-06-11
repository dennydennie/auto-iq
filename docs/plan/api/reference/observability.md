# Observability Plan

## Error monitoring (Sentry)

Use **[Sentry](https://sentry.io)** for runtime errors and unhandled exceptions in `apps/api`.

| Concern | Approach |
| --- | --- |
| SDK | `@sentry/nestjs` + `@sentry/node` |
| Init | `instrument.ts` imported first in `main.ts` (before `NestFactory.create`) |
| Captured | Unhandled exceptions, unhandled rejections, 5xx from global exception filter |
| Not captured by default | Expected 4xx (validation, auth, not-found for IDOR), health check noise |
| Context | `userId`, `correlationId`, `route`, `environment`, `release` (git SHA) |
| Performance | Sentry tracing optional in Phase 7; error monitoring is required from staging |

### Setup tasks ([01-foundation](../01-foundation/plan.md) stub, full wiring in [07-hardening](../07-hardening/plan.md))

- [ ] Create Sentry project per environment (`auto-iq-api-staging`, `auto-iq-api-production`)
- [ ] `SentryModule.forRoot()` or manual `Sentry.init` in `instrument.ts` with DSN from env
- [ ] Register `SentryGlobalFilter` (or equivalent) so Nest exceptions reach Sentry
- [ ] Interceptor or middleware: set tag `correlationId` from `X-Correlation-Id`; set user on authenticated requests (id only, no PII in username field)
- [ ] `beforeSend` scrub: strip cookies, authorization headers, request bodies on auth/file routes
- [ ] Railway deploy: set `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` (git SHA) in [08-production](../08-production/plan.md)

### Alerting via Sentry

- Issue alerts: new/regressed unresolved issues in `production`
- Spike protection on error rate
- Assign on-call from Sentry → Slack/email integration
- Weekly digest for staging (optional)

Sentry complements structured logs; it does not replace them.

## Logging

- Structured JSON logs (pino or Nest logger adapter).
- Fields: `timestamp`, `level`, `message`, `correlationId`, `userId`, `route`, `durationMs`.
- Propagate `X-Correlation-Id` from ingress or generate per request; mirror value into Sentry tags.
- Request logging middleware; never log bodies for auth or file endpoints.
- Log lines for handled 4xx at `warn`; 5xx at `error` (Sentry also captures unhandled/stack paths).

## Health

| Endpoint | Checks |
| --- | --- |
| `/health/live` | Process up |
| `/health/ready` | PostgreSQL and Redis reachability for traffic admission |

Health check failures are not reported to Sentry unless readiness logic throws unexpectedly.

## Metrics (production)

Expose Prometheus-compatible metrics or use provider APM (Sentry performance monitoring optional):

- HTTP request duration and status histograms
- Listing submissions and time-to-publish
- Upload presign/register success and failure
- Notification send success, retry, failure
- DB pool usage and slow query alerts

## Tracing

- Sentry performance traces (sampled) acceptable before full OpenTelemetry.
- Optional OpenTelemetry in Phase 7 if vendor-neutral tracing is required.
- Correlation IDs in logs and Sentry regardless of tracing choice.

## Alerts (production)

| Signal | Source | Threshold idea |
| --- | --- | --- |
| New/regressed errors | Sentry | Per alert rules |
| Readiness failing | Railway / health | > 1 min |
| 5xx rate | Sentry or logs | > 1% over 5 min |
| Notification failure rate | Metrics/logs | Spike vs baseline |
| DB connections | Railway Postgres | > 80% pool |

## Dashboards

- **Sentry:** error frequency, issues by endpoint, release regressions
- Admin ops queues (API-backed counts on dashboard endpoint)
- Railway metrics for CPU, memory, replicas
- `infrastructure/observability` for any supplemental config notes
