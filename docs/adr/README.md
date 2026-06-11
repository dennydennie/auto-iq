# Architecture Decision Records

Add one ADR per significant technical decision.

## Index

| ADR | Status | Decision |
| --- | --- | --- |
| [0001-web-auth-and-csrf.md](./0001-web-auth-and-csrf.md) | Accepted | Web uses HttpOnly cookies; unsafe cookie-authenticated requests require CSRF protection from identity onward. |
| [0002-typeorm-migration-discipline.md](./0002-typeorm-migration-discipline.md) | Accepted | Current NestJS scaffold uses TypeORM migrations with strict SQL review as an explicit Flyway-rule exception. |
| [0003-seller-contact-visibility.md](./0003-seller-contact-visibility.md) | Accepted | Seller contacts stay hidden in buyer-facing payloads; contact release remains post-viewing and controlled. |
| [0004-guest-listing-detail.md](./0004-guest-listing-detail.md) | Accepted | Guests can consume public listing detail at `/api/v1/listings/:slugOrId`. |
| [0005-mandatory-seller-documents.md](./0005-mandatory-seller-documents.md) | Accepted | Seller submit requires `SELLER_ID`, `REGISTRATION_BOOK`, and `PURCHASE_IMPORT_DOCS`. |
| [0006-buyer-facing-inspection-summary.md](./0006-buyer-facing-inspection-summary.md) | Accepted | Buyer inspection visibility is limited to approved `BuyerInspectionSummaryDto` fields. |
| [0007-tida-import-quotations.md](./0007-tida-import-quotations.md) | Accepted | TIDA quotations share the `vehicle-requests` workflow in MVP. |
| [0008-launch-notification-channels.md](./0008-launch-notification-channels.md) | Accepted | Launch notifications use Email + SMS only. |
| [0009-listing-admin-actions.md](./0009-listing-admin-actions.md) | Accepted | Admins exclusively perform sold/reserved/reject/delist actions. |
| [0010-primary-identity-key.md](./0010-primary-identity-key.md) | Accepted | Phone is primary onboarding and OTP identity; login accepts email or phone. |
