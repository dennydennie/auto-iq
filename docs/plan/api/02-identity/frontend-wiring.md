# Phase 2 — Frontend wiring

Import: `@auto-iq/contracts/identity`, `ROUTES` from `@auto-iq/contracts`.

## Auth header rules

| Call | `Authorization` | `anonymous` on `ApiClient` |
| --- | --- | --- |
| register, login, sendOtp, verifyOtp, forgotPassword, resetPassword | Omit | `true` |
| csrf | Omit | `true` |
| refresh | Cookie required for web; optional body only for future non-browser clients | `false` |
| logout, me, consents | Cookie required; unsafe methods send `X-CSRF-Token` | `false` |

## Endpoints

| Method | Path (`ROUTES`) | Body type | Response type | Notes |
| --- | --- | --- | --- | --- |
| POST | `auth.register` | `RegisterRequest` | `RegisterResponse` | `role`: `BUYER` \| `SELLER`; `phone` E.164; if `otpRequired` → OTP flow |
| GET | `auth.csrf` | — | `CsrfResponse` | Bootstrap token for unsafe cookie-authenticated requests |
| POST | `auth.login` | `LoginRequest` | `LoginResponse` | `identifier` = email or phone; web stores no tokens |
| POST | `auth.refresh` | `RefreshRequest?` | `RefreshResponse` | Empty body ok with cookies |
| POST | `auth.logout` | — | 204 | Clear local tokens / cookies |
| POST | `auth.sendOtp` | `SendOtpRequest` | `SendOtpResponse` | Show `expiresIn`, `attemptsRemaining` |
| POST | `auth.verifyOtp` | `VerifyOtpRequest` | `VerifyOtpResponse` | `code` string |
| POST | `auth.forgotPassword` | `ForgotPasswordRequest` | 204 | `email` only |
| POST | `auth.resetPassword` | `ResetPasswordRequest` | 204 | `token` from email link query |
| GET | `me.profile` | — | `MeResponse` | Drive nav: `roles`, `buyerProfile`, `sellerProfile`, `consentsComplete` |
| PATCH | `me.profile` | `UpdateMeRequest` | `MeResponse` | Partial; buyer prefs vs `businessName` for seller |
| POST | `me.consents` | `RecordConsentRequest` | `ConsentsResponse` | `accepted` must be `true`; `version` semver |

Unsafe cookie-authenticated calls must include `X-CSRF-Token`. If the token expires, the web API layer may refresh it once via `auth.csrf` and retry the original request once.

## Required request fields

### `RegisterRequest`

`fullName`, `email`, `phone`, `password`, `role`, `city` — all required.

### `RecordConsentRequest`

`consentType`: `TERMS` | `PRIVACY` | `SELLER_RULES` | `BUYER_RULES` | `NO_SIDE_DEAL`; `version`: e.g. `"1.0.0"`; `accepted`: `true`.

## UI gates

| Gate | Source field |
| --- | --- |
| Phone verification | `MeResponse.phoneVerified` |
| Seller listing wizard | `sellerProfile.consentsComplete` |
| Post-register OTP | `RegisterResponse.otpRequired` |

## Error codes to handle

`INVALID_CREDENTIALS`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`, `RATE_LIMITED`, `VALIDATION_FAILED` — from `API_ERROR_CODES`.

## Frontend quality

Auth and onboarding screens must satisfy [frontend-quality.md](../reference/frontend-quality.md): labeled fields, keyboard-visible focus, externalized strings, and shared date/number formatting where applicable.
