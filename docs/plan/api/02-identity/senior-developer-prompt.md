# Senior Developer Prompt — Phase 2: Identity, Consent, and Profiles

You are the senior developer responsible for delivering **Phase 2** across backend, contracts, and the auth/profile wiring needed by `apps/web`.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/security.md](../reference/security.md)
- [../../../../packages/contracts/src/identity.ts](../../../../packages/contracts/src/identity.ts)
- [../../../../packages/contracts/src/routes.ts](../../../../packages/contracts/src/routes.ts)

## Mission

Deliver registration, login, CSRF bootstrap/enforcement, OTP, logout, forgot/reset password, `/me`, consents, and buyer/seller profiles in a way that later seller, marketplace, and admin phases can build on directly.

## Ask before coding if unresolved

1. Are there any environment-specific exceptions to [ADR 0001](../../../adr/0001-web-auth-and-csrf.md), or is HttpOnly-cookie web auth with CSRF fully accepted?
2. Which unique identity rule is authoritative: email only, phone only, or both?
3. Are inspector/admin users self-registered, seeded, or admin-created only?
4. Are consent versions already defined, or do you need the first canonical version set now?

If these are not settled in Phase 0 artifacts, stop and ask before locking DB constraints, CSRF behavior, or response shapes.

## Required deliverables

1. `identity`, `accounts`, `buyer-profiles`, and `seller-profiles` modules.
2. Phase 2 migrations and entities registered in `DbModule`.
3. All Phase 2 routes implemented exactly from `ROUTES.auth.*` and `ROUTES.me.*`, including `ROUTES.auth.csrf`.
4. Request/response DTOs aligned with `@auto-iq/contracts/identity`.
5. OTP backed by Redis with rate limits and TTL.
6. CSRF guard/service for unsafe cookie-authenticated routes.
7. Audit coverage for login, failed login, password reset, and consent recording.

## Execution path

1. Implement the Phase 2 tables and entities first.
2. Build password hashing, HttpOnly cookie session issuance, role guards, CSRF, and auth middleware/guards.
3. Implement OTP send/verify and forgot/reset flows with adapters that are safe in CI and local dev.
4. Implement `/me`, partial profile update, and idempotent consent recording.
5. Wire `apps/web/app/auth/signup`, `apps/web/app/onboarding`, and shared auth/session helpers to the exact contract routes and bodies.
6. Update Swagger and any contract exports needed to keep backend and frontend aligned.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md) exactly.
- `apps/web` must use `ROUTES` and `@auto-iq/contracts/identity` types only.
- `apps/web` must use cookie credentials and CSRF; do not persist JWTs in browser storage.
- Respect the UI gates for OTP, phone verification, seller wizard access, and consent completion.
- Handle the documented auth error codes explicitly in the frontend API layer.
- Auth and onboarding UI changes must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run the required unit and e2e tests from [testing.md](./testing.md).
- Confirm response payloads actually satisfy the contract types, not just path presence.
- Verify 401 vs 403 behavior, CSRF rejection/acceptance, OTP throttling, consent idempotency, and password change behavior.

## Definition of done

Use [definition-of-done.md](./definition-of-done.md) as the finish line. No later phase should need to revisit auth payload shapes or profile persistence rules.

## Git checkpoint

- After all Phase 2 required tests pass and the DOD is fully met, create a focused commit for identity/profile delivery and push the branch.
- Do not commit or push while auth transport, unique identity rules, or consent behavior still rely on undocumented assumptions.

## Completion rule

Do not leave “temporary” auth shortcuts, browser token persistence, seeded secrets, missing CSRF enforcement, or undocumented consent semantics. If any auth decision is still open, ask directly and block implementation rather than guessing.
