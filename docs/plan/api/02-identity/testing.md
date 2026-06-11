# Phase 2 — Testing

## Testing criteria

| # | Criterion |
| --- | --- |
| T2.1 | Register → login → `/me` e2e green |
| T2.2 | OTP rate limit returns 429 |
| T2.3 | Role guard blocks cross-role access |
| T2.4 | Consent idempotency verified |
| T2.5 | Password hash never equals plaintext in DB (unit) |
| T2.6 | E2E responses satisfy `RegisterResponse`, `LoginResponse`, `MeResponse` shapes |
| T2.7 | Unsafe cookie-authenticated routes reject missing/invalid CSRF and accept valid CSRF |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| `PasswordService` | Rejects weak password; hash verify round-trip |
| `RolesGuard` | Allows matching role; denies missing/wrong role |
| `ConsentService` | Same version twice → single active record |
| `OtpService` | Expired code rejected; wrong code rejected |
| `UserRepository` | Unique email/phone violation surfaces domain error |
| `CsrfService` / guard | Issues token, rejects missing/invalid token, allows valid token |

## E2E tests (required)

| ID | Flow | Expected |
| --- | --- | --- |
| E2.1 | `POST /auth/register` (seller) → `POST /auth/login` → `GET /me` | 201/200; `me` has seller role + profile id |
| E2.2 | Register buyer → login → `POST /me/consents` (all types) → `GET /me` | Consents reflected |
| E2.3 | `POST /auth/otp/send` × over limit | 429 |
| E2.4 | Valid OTP → `POST /auth/otp/verify` | 200; verification flag set |
| E2.5 | `GET /me` without auth | 401 |
| E2.6 | Seller token on admin-only stub route (if present) | 403 |
| E2.7 | `POST /auth/forgot-password` → `POST /auth/reset-password` with token | Password changed; old password login fails |
| E2.8 | `POST /auth/logout` → `GET /me` | 401 |
| E2.9 | `GET /auth/csrf` → unsafe authenticated request without token → repeat with token | 403 then success |

## E2E tests (recommended)

| ID | Flow |
| --- | --- |
| E2.10 | Refresh token/session renewal |
| E2.11 | Register duplicate email/phone → 409 |

## Sign-off gate

All required tests pass in CI; [definition-of-done.md](./definition-of-done.md) complete.
