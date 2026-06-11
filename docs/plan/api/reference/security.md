# API Security Plan

## Authorization model

- Deny by default: every route protected unless explicitly marked public (catalogue endpoints per [00-discovery](../00-discovery/plan.md)).
- Role guards: `BUYER`, `SELLER`, `ADMIN`, `INSPECTOR` with composite rules where needed (seller owns listing, inspector assigned to task).
- Resource ownership checks on all `:id` routes; return 404 when unauthorized to reduce IDOR leakage.

## Authentication

- Web clients use HttpOnly, `Secure`, `SameSite` session cookies by default; see [ADR 0001](../../../adr/0001-web-auth-and-csrf.md).
- Bearer JWT is reserved for future non-browser clients and must not be stored in browser storage.
- Short-lived access + refresh rotation is required if JWT support is later enabled.
- Hash passwords with Argon2 or bcrypt (cost factor documented in env).
- OTP and password-reset tokens stored in Redis with TTL and single-use semantics.

## CSRF

- Unsafe cookie-authenticated methods require CSRF protection from Phase 2 onward.
- Preferred contract: `GET ROUTES.auth.csrf` returns `CsrfResponse`; clients send `X-CSRF-Token` on unsafe methods.
- E2E tests must prove missing/invalid CSRF returns 403 and valid CSRF allows the request.

## Rate limiting

Apply `@nestjs/throttler` (and Redis backing for multi-instance) on:

- Login, register, OTP send/verify
- Password forgot/reset
- Presign and file registration endpoints
- Buyer quote, viewing, and vehicle-request creation

## Files and storage

- Magic-byte validation on register-upload callbacks.
- Separate buckets/prefixes: public images, private seller documents, inspection reports.
- Presigned upload URLs: short TTL, content-type and max-size constraints.
- Download only via presigned GET after service-layer authorization.

## Data protection

- No seller identity documents in public or buyer catalogue DTOs.
- PII in logs: redact phone, email, document IDs in info-level logs.
- Encrypt secrets via platform secret manager in production ([08-production](../08-production/plan.md)).

## Audit

- Log actor id, action, entity type/id, outcome, correlation id for: login failures, listing transitions, publish, document access, admin moderation.
- Append-only `audit_logs` and `admin_action_logs` tables.

## Security verification (Phase 7)

- Automated tests for IDOR on listings, documents, inspections, viewings.
- Manual checklist: cookie flags, CORS, CSRF enforcement, dependency audit in CI.
- Optional external penetration test before production cutover.
