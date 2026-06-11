# Phase 2 — Definition of Done

## Functional

- [ ] Buyer and seller can register, login, logout, and call `GET /me`
- [ ] Web login establishes HttpOnly cookie session; browser JWT persistence is absent
- [ ] OTP send/verify works with Redis-backed codes
- [ ] Password forgot/reset flow completes with adapter (no-op ok)
- [ ] Consents recorded with version; re-post is idempotent
- [ ] `PATCH /me` updates allowed profile fields
- [ ] Protected routes return **401** without session/token
- [ ] Wrong role returns **403** on role-guarded routes
- [ ] Unsafe cookie-authenticated routes enforce CSRF

## Data

- [ ] Migration applied; entities in `DbModule`
- [ ] Unique constraints enforced for email/phone per ADR

## API / contracts

- [ ] All Phase 2 routes match [frontend-wiring.md](./frontend-wiring.md) and `packages/contracts/src/routes.ts`
- [ ] Request/response bodies match `@auto-iq/contracts/identity` types
- [ ] `ROUTES.auth.csrf` and `CsrfResponse` exist if cookie auth is active
- [ ] Swagger schemas align with contracts
- [ ] Error envelope on auth failures (no stack leak)

## Security

- [ ] Passwords never returned in API responses
- [ ] Rate limits on login, OTP, password reset active
- [ ] Audit rows for security events listed in [plan.md](./plan.md)
- [ ] CSRF failure does not leak sensitive session details

## Frontend quality

- [ ] Auth and onboarding changes satisfy [frontend-quality.md](../reference/frontend-quality.md)

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | [testing.md](./testing.md) green |
| Security reviewer | Rate limits + audit (light review) |
