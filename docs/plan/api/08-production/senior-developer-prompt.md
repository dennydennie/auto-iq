# Senior Developer Prompt — Phase 8: Production Deployment

You are the senior developer responsible for taking the API from “staging-ready” to **deployed, verified, and operable on Railway/Tigris/Redis/Postgres**.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/observability.md](../reference/observability.md)
- [../../../../scripts/smoke-api.mjs](../../../../scripts/smoke-api.mjs)

## Mission

Deploy `apps/api` to Railway with staging and production environments, wire Tigris/Redis/Postgres, verify health and critical smoke flows, prove rollback works, and leave clear runbooks and ownership notes.

## Ask before coding or deploying if unresolved

1. What are the actual Railway project, service, and environment names?
2. What are the real staging and production web origins for `CORS_ORIGINS`?
3. What are the exact Tigris bucket names/prefixes per environment?
4. What are the exact SameSite/domain/CSRF expectations for the production web/API origin relationship under [ADR 0001](../../../adr/0001-web-auth-and-csrf.md)?
5. Who owns production smoke credentials and the 30–60 minute post-deploy watch window?

Do not deploy with placeholder URLs, bucket names, or secrets. Ask if they are missing.

## Required deliverables

1. Deployment configuration for `apps/api` on Railway.
2. Release-time TypeORM migration execution and verified health endpoints.
3. Environment variable setup for Postgres, Redis, Tigris, Sentry, and auth secrets.
4. Staging smoke, rollback drill, and production smoke evidence.
5. Runbook or ADR notes with Railway project/service names, bucket names, and escalation path.

## Execution path

1. Finalize deploy packaging and migration command.
2. Configure staging first and prove health, storage, cookie auth, CSRF, and admin smoke checks.
3. Run and document the rollback drill on staging.
4. Promote to production only after the full CI suite and Phase 7 gates are green on the same SHA.
5. Perform production smoke and monitor the defined post-deploy window.
6. Record environment metadata, on-call, and escalation details in repo docs.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md).
- `apps/web` must point to the deployed API via `NEXT_PUBLIC_API_URL` without path hardcoding.
- Verify CORS, `credentials: 'include'`, cookie flags, and CSRF against real deployed origins.

## Testing and verification

- Run the required staging smoke, CSRF-protected mutation smoke, rollback, production smoke, and regression checks from [testing.md](./testing.md).
- Do not claim success until the deployed URL passes the health and critical route checks with real environment wiring.

## Definition of done

Use [definition-of-done.md](./definition-of-done.md) as the finish line. Production is not done until deploy, rollback, smoke, backup verification, and monitoring evidence all exist.

## Git checkpoint

- After staging smoke, rollback, production smoke, and the full Phase 8 DOD are complete, create a focused production-phase commit and push the branch.
- Do not commit or push while deployment configuration, environment wiring, smoke evidence, or monitoring checks are still incomplete.

## Completion rule

Do not end with “deployment config added” if staging/prod smoke was not run. If access, secrets, or environment names are missing, ask for them explicitly and block closure.
