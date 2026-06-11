# Phase 2 CSRF Design Note

ADR 0001 requires CSRF on unsafe cookie-authenticated browser requests from Phase 2 onward.

The Phase 1 contract surface is already reserved:

- Route: `ROUTES.auth.csrf` -> `GET /api/v1/auth/csrf`
- Response: `CsrfResponse`
- Header: `X-CSRF-Token`
- Default cookie name: `auto_iq_csrf`
- Default config keys: `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME`

Phase 2 implementation must:

- Generate a per-session CSRF secret for web cookie sessions.
- Return a request token from `GET /api/v1/auth/csrf`.
- Reject unsafe cookie-authenticated requests missing a valid token with `403`.
- Add E2E coverage for missing, invalid, expired, and valid tokens.
