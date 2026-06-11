# Senior Developer Prompt — Phase 7: Hardening and Launch Readiness

You are the senior developer responsible for making the MVP **secure, observable, contract-safe, and operationally supportable** before production work begins.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/security.md](../reference/security.md)
- [../reference/observability.md](../reference/observability.md)
- [../reference/testing-conventions.md](../reference/testing-conventions.md)

## Mission

Consolidate Phases 1–6 into a production-ready MVP with strong authorization coverage, CSRF regression coverage, contract tests, frontend quality checks, load evidence, Sentry/observability wiring, backup/restore proof, and operational runbooks.

## Ask before coding if unresolved

1. Is there a staging Sentry project/DSN available for real verification?
2. What load-test tool is preferred if not already decided: k6 or artillery?
3. Are the p95 targets in [testing.md](./testing.md) accepted as the working thresholds?
4. Where should backup/restore evidence and rollback notes be stored if not in this repo?

Do not skip these by downgrading the phase. Ask if the environment or target is missing.

## Required deliverables

1. Full MVP E2E suite, including the trust workflow.
2. IDOR/authorization suite across listings, documents, inspections, quotes, and viewings.
3. Contract tests against `@auto-iq/contracts`.
4. Sentry/error scrubbing setup and staging verification.
5. Load-test evidence and documented outcomes or accepted waivers.
6. Runbooks in `docs/operations/` for DB outage, 5xx spikes, and notification failures.
7. Accessibility and i18n evidence for all changed web surfaces.

## Execution path

1. Audit all Phase 1–6 routes and DTOs for contract drift and authorization holes.
2. Add the trust-workflow E2E plus IDOR and CSRF regression coverage.
3. Add contract tests that import DTOs and `ROUTES` from `packages/contracts`.
4. Wire Sentry and confirm safe event scrubbing and staging ingestion.
5. Run load tests, backup/restore checks, and migration rollback drills.
6. Finish frontend quality evidence, ops documentation, and environment reference needed by production deployment.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md).
- No new routes are allowed; the whole frontend must already be using `ROUTES` and contract DTOs only.
- Verify correlation IDs are visible in user-facing error handling and propagated to browser monitoring where applicable.
- Confirm pagination mode usage is correct on every list screen.
- Confirm unsafe cookie-authenticated requests use `X-CSRF-Token` and browser JWT persistence is absent.
- Confirm [frontend-quality.md](../reference/frontend-quality.md) across the full app.

## Testing and verification

- Run all required checks from [testing.md](./testing.md), including the full trust workflow, IDOR suite, CSRF suite, frontend quality checks, contract tests, load tests, and staging manual checks.
- A green unit test suite is not enough; this phase depends on environment evidence and operational drills.

## Definition of done

Treat [definition-of-done.md](./definition-of-done.md) as a hard release gate. Phase 8 must not start while any P0/P1 security defect remains open.

## Git checkpoint

- After the hardening gates are complete, all required checks in [testing.md](./testing.md) are green, and the DOD is satisfied, create a focused Phase 7 commit and push the branch.
- Do not commit or push while security defects, missing runbooks, failed contract tests, or incomplete staging evidence remain.

## Completion rule

Do not finish with “security follow-up later.” If staging Sentry, CSRF regression coverage, frontend quality evidence, backup restore, or load targets are unavailable, ask for the missing access or explicit waiver before closing the phase.
