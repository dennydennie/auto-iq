# Data Model

PostgreSQL schema owned by TypeORM entities and migrations in `apps/api`; see [ADR 0002](../../../adr/0002-typeorm-migration-discipline.md) for the Flyway-rule exception and migration discipline.

## Conventions

- Primary keys: `uuid` (`gen_random_uuid()` default).
- Timestamps: `timestamptz` (`created_at`, `updated_at`; soft-delete `deleted_at` only where required).
- Money: `numeric(14,2)`.
- States: PostgreSQL enums or `text` with check constraints; every change logged in a history table where workflow applies.
- Migrations: TypeORM migrations only for the current NestJS scaffold; never edit applied migrations; one migration per logical change; review generated SQL in PRs.

## Core tables

| Table | Module | Notes |
| --- | --- | --- |
| `users` | identity | Credentials, status, last login |
| `user_roles` | identity | `BUYER`, `SELLER`, `ADMIN`, `INSPECTOR` |
| `user_consents` | accounts | Terms, privacy, role-specific rules |
| `buyer_profiles` | buyer-profiles | Preferences |
| `seller_profiles` | seller-profiles | Seller onboarding |
| `seller_verification_records` | seller-profiles | ID metadata references |
| `vehicles` | listings | Listing root; status column |
| `vehicle_status_history` | listings | Immutable transitions |
| `vehicle_specs` | listings | Make, model, year, fuel, etc. |
| `vehicle_pricing` | listings | Ask price, currency |
| `vehicle_images` | listing-media | Public metadata + storage keys |
| `vehicle_documents` | listing-documents | Private metadata |
| `inspection_tasks` | inspections | Assignment and status |
| `inspection_reports` | inspections | Report files and summary |
| `inspection_findings` | inspections | Checklist rows |
| `ownership_verifications` | ownership-verification | Reviewer outcome |
| `quote_requests` | quotes | Per-listing buyer inquiries |
| `vehicle_requests` | vehicle-requests | Sourcing requests |
| `saved_vehicles` | buyer-profiles | Buyer favourites |
| `viewing_appointments` | viewings | Scheduled viewings |
| `viewing_participants` | viewings | Buyer, seller, admin roles |
| `approved_viewing_locations` | reference-data | Admin-managed locations |
| `notifications` | notifications | Outbound message records |
| `notification_attempts` | notifications | Provider retries |
| `audit_logs` | audit | Cross-domain audit |
| `admin_action_logs` | admin-ops | Admin-specific actions |

## Workflow enums

See [backend-implementation-plan.md](../../../backend-implementation-plan.md) §7 for canonical state lists:

- Listing: `DRAFT` → … → `PUBLISHED` / `REJECTED` / `DELISTED` / `SOLD` / `RESERVED`
- Ownership verification: `NOT_STARTED` … `NEEDS_CLARIFICATION`
- Inspection: `UNASSIGNED` … `BUYER_SUMMARY_APPROVED`
- Viewing: `REQUESTED` … `NO_SHOW`
- Quote: `NEW` … `CANCELLED`
- Vehicle request: `NEW` … `CANCELLED`

## Indexing

- All foreign keys indexed.
- Partial indexes on queue workloads: `vehicles(status)` where status in (`SUBMITTED`, `INSPECTION_PENDING`, …), active viewings, pending notifications.
- Catalogue filters: price range, make/model, year, location facets as product confirms filters.

## Public vs private data

- Never expose `vehicle_documents` fields on public listing DTOs.
- Buyer inspection summary is a projection table or view fed only after `BUYER_SUMMARY_APPROVED`.
- Storage keys for private buckets are never returned to unauthorized clients; use presigned URLs after authz.

## Migration delivery

| Phase | Migrations |
| --- | --- |
| [01-foundation](../01-foundation/plan.md) | Extensions (`pgcrypto`), baseline config tables if any |
| [02-identity](../02-identity/plan.md) | users, roles, consents, profiles |
| [03-seller-listings](../03-seller-listings/plan.md) | vehicles, specs, pricing, images, documents, status history |
| [04-admin-ops](../04-admin-ops/plan.md) | inspections, ownership, admin logs |
| [05-buyer-marketplace](../05-buyer-marketplace/plan.md) | quotes, vehicle_requests, saved_vehicles |
| [06-viewings-notifications](../06-viewings-notifications/plan.md) | viewings, notifications, reference locations |
