# Phase 1 — Testing

Conventions: [testing-conventions.md](../reference/testing-conventions.md).

## Testing criteria

| # | Criterion |
| --- | --- |
| T1.1 | Health e2e passes in CI |
| T1.2 | Readiness reflects DB/Redis truth |
| T1.3 | Error envelope shape stable for thrown `HttpException` |
| T1.4 | Correlation id present on response header and error body |
| T1.5 | Config validation rejects invalid env in unit test |
| T1.6 | CORS/cookie baseline matches ADR 0001 for local web origin |

## Unit tests (required)

| Test | File (suggested) | Asserts |
| --- | --- | --- |
| Config schema rejects missing `DATABASE_URL` | `config/*.spec.ts` | Boot/config factory throws or validation fails |
| Exception filter maps `BadRequestException` to envelope | `common/filters/*.spec.ts` | Body has `code`, `message`, `correlationId` |
| Correlation interceptor sets/propagates header | `common/interceptors/*.spec.ts` | `X-Correlation-Id` on mock response |
| `AbstractRepository` delegates to underlying repo | `db/repository/abstract.repository.spec.ts` | Smoke subclass if no entities yet |
| Cookie/CORS config factory | `config/*.spec.ts` | Credentials, origin allowlist, cookie flags are derived from env/profile |

## E2E tests (required)

| Test | File (suggested) | Steps | Expected |
| --- | --- | --- | --- |
| Live health | `test/e2e/health.e2e-spec.ts` | `GET /api/v1/health/live` | 200 |
| Ready health — success | same | DB + Redis up | 200, body shows connected indicators |
| Ready health — DB down | same | Stop Postgres or wrong `DATABASE_URL` | 503 |
| Validation pipe | `test/e2e/app.e2e-spec.ts` | POST invalid DTO to stub route | 400 + field `details` |
| Unknown route | same | `GET /api/v1/does-not-exist` | 404 + envelope |

## E2E tests (recommended)

| Test | Asserts |
| --- | --- |
| Ready — Redis down | 503 when Redis unavailable |
| Swagger disabled in `NODE_ENV=test` | OpenAPI path returns 404 or disabled |
| Cookie/CORS preflight for local web origin | Allows credentials only for configured origins |

## Manual verification

- [ ] Run `scripts/dev` bootstrap on clean machine (or document blockers)

## Sign-off gate

All required unit and e2e tests pass in CI; [definition-of-done.md](./definition-of-done.md) checklist complete.
