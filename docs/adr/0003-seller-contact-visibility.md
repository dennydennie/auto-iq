# ADR 0003: Seller Contact Visibility

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product + Operations |
| Date | 2026-06-09 |
| Revisit | 2026-10-01 |

## Decision

Seller contact details must not be exposed in the buyer-facing catalogue or listing detail payloads. Contact details are treated as post-transaction information and are only available through a separate, logged admin workflow after buyer and seller have reached a confirmed viewing outcome.

For MVP `Phase 0`, no buyer-facing listing endpoint returns raw seller contact information.

## Consequences

- `PublicListingDto` remains contactless and free of owner phone/email fields.
- Admin listing actions and internal review UIs may show owner contacts as needed, but only behind admin controls.
- Any future feature that exposes contact details must require a confirmed viewing state and dedicated authorization checks before release.

## Contract impact

- `apps/web` and `apps/mobile` should keep contact fields out of `@auto-iq/contracts/catalogue.ts` buyer-facing models.
- Any secure reveal endpoint should be introduced as a new admin workflow in a later phase, with explicit audit logging.

