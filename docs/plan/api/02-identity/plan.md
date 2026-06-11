# Phase 2: Identity, Consent, and Profiles

| | |
| --- | --- |
| **Goal** | Users register, authenticate, verify OTP, reset password, accept consents, and maintain buyer/seller profiles. |
| **Depends on** | [01-foundation](../01-foundation/plan.md), [00-discovery](../00-discovery/plan.md) matrix |
| **Blocks** | [03-seller-listings](../03-seller-listings/plan.md), [05-buyer-marketplace](../05-buyer-marketplace/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Data model

Migration: `users`, `user_roles`, `user_consents`, `buyer_profiles`, `seller_profiles`. See [data-model.md](../reference/data-model.md).

Register entities/repos in `DbModule` only.

## Modules

| Module | Responsibility |
| --- | --- |
| `identity` | Register, login, logout, refresh, password, OTP |
| `accounts` | `/me`, consents |
| `buyer-profiles` | Buyer profile on role assignment |
| `seller-profiles` | Seller profile, rules flags |

## Endpoints

Implement exactly [frontend-wiring.md](./frontend-wiring.md) / `ROUTES.auth.*`, `ROUTES.me.*` with types from `@auto-iq/contracts/identity`.

## Tasks

- [ ] `User` entity; unique email and/or phone per ADR
- [ ] Password hashing (Argon2/bcrypt)
- [ ] HttpOnly cookie session per [ADR 0001](../../../adr/0001-web-auth-and-csrf.md); `RolesGuard` + `@Roles()`
- [ ] CSRF route/guard implemented for unsafe cookie-authenticated routes
- [ ] OTP in Redis with TTL; throttling per [security.md](../reference/security.md)
- [ ] Register creates role + profile row
- [ ] Consent types and idempotent `POST /me/consents`
- [ ] Audit: login, failed login, password reset
- [ ] Email/SMS no-op adapters for OTP/reset

## Next phase

[03-seller-listings/plan.md](../03-seller-listings/plan.md)
