# ADR 0001: Web Auth Transport and CSRF Protection

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Engineering lead |
| Date | 2026-06-04 |
| Revisit | Before native mobile implementation |

## Decision

`apps/web` uses HttpOnly, Secure, SameSite session cookies for authenticated browser sessions.

Bearer JWT access tokens are not stored in browser storage and are not the default web transport. JWT fields may remain optional in shared contracts only for future non-browser clients, such as native mobile.

Cookie-backed unsafe requests require CSRF protection from Phase 2 onward. The API must define the exact CSRF mechanism before identity routes are implemented. The preferred contract is:

- `GET ROUTES.auth.csrf` returns a `CsrfResponse` containing a request token.
- Unsafe authenticated methods send the token in `X-CSRF-Token`.
- Login, logout, refresh, profile updates, listing mutations, admin actions, quote creation, viewing creation, and notification retries are covered.

## Consequences

- `apps/web` API calls use `credentials: 'include'`.
- `apps/web` omits `Authorization` for normal browser requests.
- `packages/contracts` must expose the CSRF route and response type before Phase 2 closes.
- E2E tests must prove unsafe cookie-authenticated requests fail without CSRF and pass with a valid token.
- Phase 8 must verify cookie domain, SameSite, Secure, CORS, and CSRF behavior against the real deployed web origins.

## Rationale

HttpOnly cookies reduce token exfiltration risk for the web client and align with the repository security rule. CSRF is introduced with the auth implementation instead of being deferred to hardening because cookie auth changes the threat model as soon as unsafe routes exist.
