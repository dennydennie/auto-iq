# Senior Developer Prompt — Phase 1: Foundation

You are the senior developer responsible for delivering **Phase 1** for `apps/api` and the phase-1 frontend/API integration baseline.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/architecture.md](../reference/architecture.md)
- [../reference/testing-conventions.md](../reference/testing-conventions.md)

## Mission

Make the API bootable, testable, and structurally correct with PostgreSQL, Redis, validated config, health endpoints, correlation IDs, and shared error conventions. This phase is the foundation for all later work, so no placeholders that would force refactors in Phases 2–8.

## Ask before coding if unresolved

1. Has Phase 0 accepted [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) and recorded any environment-specific cookie domain/SameSite constraints?
2. Is the local dev database strategy Docker Compose, repo scripts, or an existing shared local stack?
3. Is Sentry expected to be stubbed only, or should a real DSN path already exist for non-production environments?

Do not paper over missing decisions with ad hoc defaults if they affect app boot, cookie/CORS behavior, CSRF, or frontend auth behavior.

## Required deliverables

1. NestJS foundation wired per [plan.md](./plan.md) and [../reference/architecture.md](../reference/architecture.md).
2. `DbModule`, Redis module, config validation, cookie/CORS baseline, correlation ID flow, and error envelope.
3. `/api/v1/health/live` and `/api/v1/health/ready` with DB/Redis truth.
4. Swagger gated for development.
5. `packages/contracts` error/client baseline aligned with [frontend-wiring.md](./frontend-wiring.md).
6. `scripts/dev/` or equivalent one-command local bootstrap documentation.

## Execution path

1. Add foundation dependencies and fail-fast env validation.
2. Wire TypeORM boot, migration entrypoint, and the shared `DbModule` per [ADR 0002](../../../adr/0002-typeorm-migration-discipline.md).
3. Add global validation, exception filter, and correlation ID middleware/interceptor.
4. Implement health endpoints and readiness checks against real DB/Redis state.
5. Stub feature modules in a way that matches the modular-monolith structure without app-internal barrel imports.
6. Wire the frontend-facing health contract through `@auto-iq/contracts` and ensure `apps/web` can call it without path drift.
7. Document env vars, local boot, and CI expectations before closing the phase.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md) exactly.
- Establish the central API client pattern for `apps/web`, including `NEXT_PUBLIC_API_URL`, `ROUTES`, `ApiError`, `credentials: 'include'`, and correlation ID handling.
- Do not hardcode URLs in `apps/web`; all health calls must flow through `@auto-iq/contracts`.
- Do not add browser JWT persistence. If JWT support is scaffolded, keep it behind future non-browser client boundaries.
- New or changed web surfaces must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run the required unit and e2e checks from [testing.md](./testing.md).
- Verify invalid env handling, health readiness failure modes, cookie/CORS baseline, and stable error envelope shape.
- CI readiness is part of the phase, not a later task.

## Definition of done

Use [definition-of-done.md](./definition-of-done.md) as a hard gate. Phase 2 must be able to start without revisiting foundation architecture.

## Git checkpoint

- After the Phase 1 DOD is satisfied and required tests in [testing.md](./testing.md) are green, create a focused Phase 1 commit and push the branch.
- Do not commit or push a partial foundation that still leaves boot, health, config, or CI gates failing.

## Completion rule

Do not stop at “app boots locally.” Finish the scripts, docs, tests, cookie/CORS defaults, and CI path needed to make the foundation reusable by later agents without guesswork.
