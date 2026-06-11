# Phase 7 — Testing

Phase 7 aggregates and extends tests from Phases 1–6. All prior phase **required** tests must still pass.

## Testing criteria

| # | Criterion |
| --- | --- |
| T7.1 | Full trust workflow e2e green |
| T7.2 | IDOR suite green |
| T7.3 | Contract tests green |
| T7.4 | Sentry captures staged unhandled error (staging smoke) |
| T7.5 | Load test meets agreed p95 or waiver documented |
| T7.6 | Cross-phase CSRF regression suite green |

## E2E tests (required)

### Full trust workflow

| ID | File (suggested) | Flow |
| --- | --- | --- |
| E7.1 | `test/e2e/trust-workflow.e2e-spec.ts` | Register seller → create/submit listing → admin verify/inspect/approve/publish → register buyer → browse catalogue → save → quote → request viewing → confirm → assert notification record |

### IDOR / authorization

| ID | Test | Expected |
| --- | --- | --- |
| E7.2 | Buyer accesses another buyer's saved list via forged id | 404 |
| E7.3 | Buyer presign for another seller's private document | 403/404 |
| E7.4 | Seller views admin-only inspection internal fields | 404 |
| E7.5 | Unauthenticated admin publish | 401 |
| E7.6 | Inspector report on unassigned task | 404 |
| E7.7 | Unsafe cookie-authenticated mutation without CSRF | 403 |

## Contract tests (required)

| ID | Test |
| --- | --- |
| C7.1 | `PublicListingDto` — import from `@auto-iq/contracts/catalogue`; snapshot test |
| C7.2 | `ApiError` — import from `@auto-iq/contracts`; assert on 422 fixture |
| C7.3 | `MeResponse` — import from `@auto-iq/contracts/identity` |
| C7.4 | `ROUTES` paths — e2e URLs built only from `@auto-iq/contracts/routes` |
| C7.5 | `ROUTES.auth.csrf` and `CsrfResponse` are exported when cookie auth is active |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| Sentry `beforeSend` | Strips `authorization`, cookies from event |
| Global exception filter | 5xx reported; 404 validation not reported to Sentry (if configured) |

## Frontend quality checks (required)

| Area | Check |
| --- | --- |
| Accessibility | Keyboard path covers auth, seller wizard, admin queue, catalogue filters, and viewing scheduler |
| Accessibility | Labels, focus states, and non-color status indicators verified on changed screens |
| i18n | User-facing strings added in Phases 1-6 are externalized |
| i18n | Dates, prices, mileage, and counts use shared formatters |

## Load tests (required — document results)

| Scenario | Tool (suggested) | Target (starting point) |
| --- | --- | --- |
| `GET /listings` warm catalogue | k6 or artillery | p95 < 500ms @ 50 VUs, 0% errors |
| Presign + register image | k6 | p95 < 1s @ 10 VUs |

## Manual / staging (required)

| ID | Check |
| --- | --- |
| M7.1 | Trigger test error in staging → appears in Sentry with `correlationId` |
| M7.2 | Migration rollback drill notes attached to ticket |
| M7.3 | Restore Postgres backup to temp instance — success |

## Sign-off gate

E7.1 + IDOR suite + contract tests green in CI; load doc filed; DOD sign-offs recorded.

## Phase-gated verification

Run the smallest gate that covers the changed surface before promoting Phase 7 evidence.

| Gate | Command | Evidence expected |
| --- | --- | --- |
| Contract-first unit gate | `pnpm --filter api test -- --runTestsByPath src/contracts/contracts.phase7.spec.ts src/contracts/api-client.spec.ts` | DTO, route, CSRF, and client contract assertions pass |
| Error handling gate | `pnpm --filter api test -- --runTestsByPath src/common/sentry/sentry-scrubber.spec.ts src/common/filters/http-exception.filter.spec.ts` | Sentry scrubbing and exception capture behavior pass |
| Trust workflow smoke | `API_BASE=http://localhost:4000/api/v1 DATABASE_URL='postgresql://auto_iq:<local-db-credential>@localhost:5432/auto_iq' PASSWORD='<local-seed-credential>' ./scripts/dev/phase7-hardening-smoke.sh` | Health, listing, quote, viewing, IDOR/CSRF statuses, notification rows, and dashboard DB spot-checks print successfully |
| Catalogue load smoke | `API_BASE=http://localhost:4000/api/v1 node scripts/load/catalogue-smoke.mjs` | `p95Ms` and `errors` recorded in the load report |
| Presign/register load smoke | `API_BASE=http://localhost:4000/api/v1 SELLER_EMAIL=... SELLER_PASSWORD=... LISTING_ID=... node scripts/load/presign-register-smoke.mjs` | `p95Ms` and `errors` recorded in the load report |
| OpenAPI export | `pnpm --filter api openapi:export` | `docs/api/openapi.json` regenerated from the current Nest app |

Manual staging evidence is still required for Sentry ingestion, backup restore, migration rollback, and alert routing. Attach command output, timestamps, environment identifiers, and any accepted waivers to the release ticket.
