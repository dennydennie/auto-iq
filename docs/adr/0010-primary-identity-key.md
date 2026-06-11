# ADR 0010: Primary Identity Key

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product + Engineering |
| Date | 2026-06-09 |
| Revisit | 2026-10-01 |

## Decision

Phone is the primary identity key for onboarding and OTP. `RegisterRequest.phone` is required for all registrations, and OTP is sent only via phone number.

Login continues to accept email or phone in `LoginRequest.identifier`, but phone verification remains the primary trust anchor for onboarding, device recovery, and account hardening.

## Consequences

- OTP flows require `SendOtpRequest.phone` and `VerifyOtpRequest.phone` with E.164 formatting.
- Email remains required for account notifications and optional password reset messaging.
- Duplicate-phone checks and dedupe policies must normalize to E.164 before uniqueness checks.

## Contract impact

- No contract field changes are required.
- Implementations should treat phone as preferred identity for risk-based controls and support ticketing.

