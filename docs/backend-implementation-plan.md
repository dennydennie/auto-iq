# Auto IQ Backend Implementation Plan

High-level backend strategy and domain design. Step-by-step API delivery plans live in [docs/plan/api](./plan/api/README.md) (per-phase `plan.md`, `definition-of-done.md`, `testing.md`).

Planning baseline: monorepo scaffold and NestJS API shell exist; feature implementation follows the phased plans in `docs/plan/api`.

## 1. Planning Inputs

This plan is based on:

- `BiSell AutoIQ App.docx` as the functional requirements document.
- `AutoIQ.zip` as the screen and workflow reference set.
- The requested `blue` monorepo shape as the repository baseline.

## 2. Recommended Monorepo Shape

Use the same top-level shape as `blue`, but keep delivery focused on the backend-first MVP:

```text
auto-iq/
  apps/
    api/            # backend application
    web/            # buyer, seller, admin web surface
    mobile/         # reserved for later native/mobile shell parity
  packages/
    config/         # shared lint, tsconfig, env schema, build config
    contracts/      # API DTOs, schema contracts, event names
    types/          # shared domain types that are safe to reuse
  docs/
    adr/            # architecture decisions
    api/            # endpoint specs and examples
    operations/     # admin workflow and support runbooks
  infrastructure/
    database/       # PostgreSQL bootstrap, extensions, and ops SQL
    storage/        # object storage policies and local MinIO setup
    observability/  # logs, metrics, dashboards, alerts
  scripts/
    dev/            # local bootstrap and smoke scripts
```

## 3. Recommended Backend Stack

Recommended backend for `apps/api`: NestJS modular monolith with TypeORM and PostgreSQL.

Reasoning:

- It aligns with the monorepo baseline: `apps/api` is already a NestJS workspace package and shares TypeScript tooling with `apps/web` and `packages/contracts`.
- It satisfies repo requirements for PostgreSQL, explicit DTO separation, structured observability, and strong security defaults without introducing a second language runtime.
- The FRD describes one core trust workflow, not a microservice estate. A modular monolith is the lowest-risk shape for MVP delivery.
- The workflow is state-heavy: listing review, verification, inspection, quote requests, and viewing coordination all benefit from one transactional boundary; TypeORM unit-of-work semantics map cleanly to NestJS feature modules.

Recommended supporting technology:

- Node.js 22 LTS
- NestJS 11.x
- TypeORM with the PostgreSQL driver
- PostgreSQL
- TypeORM migrations for schema versioning (generated and reviewed in `apps/api`)
- `class-validator` and `class-transformer` for request/response DTO validation
- `@nestjs/passport` with HttpOnly cookie sessions for web, optional JWT support only for future non-browser clients, plus `@nestjs/throttler` for rate limits
- Redis for short-lived coordination, rate limits, OTP state, and caching
- S3-compatible object storage for images, seller documents, and inspection reports
- `@nestjs/swagger` for internal OpenAPI contract visibility

## 4. Product Scope to Build First

The backend MVP should support the exact loop described by the FRD and confirmed by the views:

1. User onboarding and role-aware account creation.
2. Seller profile completion and rules acceptance.
3. Vehicle listing draft, media upload, document upload, and submission.
4. Admin review, ownership verification, and inspection assignment.
5. Inspection capture and buyer-safe report publishing.
6. Admin approval and explicit listing publication.
7. Buyer browse, detail, saved vehicles, quote request, vehicle sourcing request, and viewing request.
8. Admin viewing coordination, reminders, and final status tracking.
9. Audit logging, notifications, and operational reporting.

Explicitly out of MVP:

- In-app payments
- Escrow
- Loan origination
- Insurance purchase
- Automated valuation
- AI damage assessment
- Full native mobile delivery

## 5. Frontend View to Backend Module Map

The ZIP confirms the screen inventory and should drive API planning.

| View group | Screens in ZIP | Backend modules needed |
| --- | --- | --- |
| Onboarding | splash, role select, sign up, OTP | auth, accounts, consent, OTP verification |
| Buyer mobile | browse, filters, vehicle detail, inspection report, request viewing, request quote, request vehicle, notifications | catalogue, public listing, inspections-public, quotes, vehicle-requests, viewings, notifications |
| Seller mobile | dashboard, 4-step listing wizard | seller-profile, listings, media, documents, submission-status |
| Admin web | overview, listing review, inspection capture, viewing scheduler | admin-ops, verification, inspections, reports, appointments |

## 6. Domain Architecture Inside `apps/api`

Keep NestJS feature modules isolated by business capability. Each module owns its TypeORM entities, repositories, services, controllers, DTOs, and tests. Register entities through a shared `DatabaseModule` (or per-module `TypeOrmModule.forFeature`) and avoid cross-module entity imports except through explicit application services.

- `identity`: registration, login, logout, password reset, phone/email verification, role assignment.
- `accounts`: user status, profile basics, consent records, preferred channels.
- `seller-profiles`: seller verification profile, ID metadata, owner declarations.
- `buyer-profiles`: buyer preferences, saved vehicles, saved searches if approved later.
- `listings`: draft creation, edit rules, submission, public catalogue projection, seller dashboard summaries.
- `listing-media`: vehicle images, cover image rules, image validation, optimized derivatives.
- `listing-documents`: private identity and ownership documents, review status, secure retrieval.
- `inspections`: inspection tasks, assignment, checklist capture, report upload, buyer-facing summary approval.
- `ownership-verification`: reviewer workflow, evidence review, outcome, risk flags, clarification loop.
- `quotes`: quote requests, responses, assignments, status history.
- `vehicle-requests`: buyer sourcing requests and partner assignment.
- `viewings`: buyer request, seller confirmation, scheduling, reminders, completion states.
- `notifications`: email, SMS, future WhatsApp adapters, template management, retry handling.
- `admin-ops`: review queue, publish controls, operational reports, moderation and suspension actions.
- `audit`: append-only audit trail, activity feeds, operational history.
- `reference-data`: vehicle makes, body types, fuel types, transmission types, approved viewing locations.

## 7. Workflow and State Design

### 7.1 Listing lifecycle

Use the FRD status model as the source of truth:

- `DRAFT`
- `SUBMITTED`
- `INSPECTION_PENDING`
- `OWNERSHIP_VERIFICATION_PENDING`
- `CHANGES_REQUESTED`
- `APPROVED`
- `PUBLISHED`
- `RESERVED`
- `SOLD`
- `REJECTED`
- `DELISTED`

Rules:

- Seller can create and edit only `DRAFT` and `CHANGES_REQUESTED`.
- Seller cannot publish.
- `PUBLISHED` requires explicit admin action.
- Buyer catalogue queries must read only `PUBLISHED` listings.
- Transition history must be immutable and queryable.

### 7.2 Ownership verification lifecycle

- `NOT_STARTED`
- `PENDING`
- `VERIFIED`
- `FAILED`
- `NEEDS_CLARIFICATION`

### 7.3 Inspection lifecycle

- `UNASSIGNED`
- `SCHEDULED`
- `IN_PROGRESS`
- `COMPLETED`
- `REPORT_UPLOADED`
- `BUYER_SUMMARY_APPROVED`
- `CANCELLED`

### 7.4 Viewing lifecycle

- `REQUESTED`
- `PENDING_SELLER_CONFIRMATION`
- `CONFIRMED`
- `RESCHEDULED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

### 7.5 Quote request lifecycle

The FRD does not define statuses explicitly, so standardize them before coding:

- `NEW`
- `ASSIGNED`
- `RESPONDED`
- `WAITING_BUYER`
- `CLOSED`
- `CANCELLED`

### 7.6 Vehicle sourcing request lifecycle

- `NEW`
- `TRIAGED`
- `ASSIGNED`
- `MATCH_FOUND`
- `QUOTED`
- `CLOSED`
- `CANCELLED`

## 8. Data Model Plan

Design for PostgreSQL first, 3NF where practical, and strict separation between public listing data and private verification data.

Core tables:

- `users`
- `user_roles`
- `user_consents`
- `buyer_profiles`
- `seller_profiles`
- `seller_verification_records`
- `vehicles`
- `vehicle_status_history`
- `vehicle_specs`
- `vehicle_pricing`
- `vehicle_images`
- `vehicle_documents`
- `inspection_tasks`
- `inspection_reports`
- `inspection_findings`
- `ownership_verifications`
- `quote_requests`
- `vehicle_requests`
- `saved_vehicles`
- `viewing_appointments`
- `viewing_participants`
- `approved_viewing_locations`
- `notifications`
- `notification_attempts`
- `audit_logs`
- `admin_action_logs`

Database decisions:

- Use `uuid` primary keys.
- Use `timestamptz` for all timestamps.
- Use `numeric(14,2)` for money.
- Store enumerated workflow states as PostgreSQL enums or constrained text values with TypeORM migration discipline.
- Keep private file metadata separate from public image metadata.
- Add partial indexes for high-volume queues such as submitted listings, pending inspections, and active viewings.
- Index all foreign keys and catalogue filter columns.

## 9. File and Media Handling Plan

The backend must treat file storage as a first-class subsystem because the seller and admin flows depend on it.

- Use S3-compatible object storage.
- Separate buckets or prefixes for `public-listing-images`, `private-seller-documents`, and `inspection-reports`.
- Validate uploads with magic bytes, not extension checks.
- Use presigned upload URLs for large files.
- Generate optimized image derivatives asynchronously after upload.
- Expose private files only through short-lived signed download URLs after authorization checks.
- Keep buyer-facing inspection attachments separate from internal inspection evidence.

## 10. API Design Plan

All endpoints are versioned under `/api/v1`. **Canonical contract for frontend wiring:** `packages/contracts` (`ROUTES` + TypeScript DTOs) and [docs/plan/api/reference/frontend-contract.md](./plan/api/reference/frontend-contract.md). Per-phase wiring: `docs/plan/api/<phase>/frontend-wiring.md`.

### 10.1 Identity and profile APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/csrf`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/otp/send`
- `POST /api/v1/auth/otp/verify`
- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `POST /api/v1/me/consents`

### 10.2 Seller and listing APIs

- `GET /api/v1/me/listings`
- `POST /api/v1/listings`
- `GET /api/v1/listings/{listingId}`
- `PUT /api/v1/listings/{listingId}/specs`
- `PUT /api/v1/listings/{listingId}/pricing`
- `POST /api/v1/listings/{listingId}/submit`
- `GET /api/v1/listings/{listingId}/timeline`
- `POST /api/v1/storage/images/presign`
- `POST /api/v1/storage/documents/presign`
- `POST /api/v1/listings/{listingId}/images`
- `POST /api/v1/listings/{listingId}/documents`

### 10.3 Public catalogue and buyer APIs

- `GET /api/v1/listings`
- `GET /api/v1/listings/{slugOrId}`
- `GET /api/v1/listings/{listingId}/inspection-summary`
- `POST /api/v1/listings/{listingId}/quotes`
- `POST /api/v1/listings/{listingId}/viewings`
- `POST /api/v1/vehicle-requests`
- `GET /api/v1/me/saved-vehicles`
- `POST /api/v1/me/saved-vehicles/{listingId}`
- `DELETE /api/v1/me/saved-vehicles/{listingId}`

### 10.4 Admin and operations APIs

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/listings`
- `GET /api/v1/admin/listings/{listingId}`
- `POST /api/v1/admin/listings/{listingId}/request-changes`
- `POST /api/v1/admin/listings/{listingId}/approve`
- `POST /api/v1/admin/listings/{listingId}/publish`
- `POST /api/v1/admin/listings/{listingId}/reject`
- `POST /api/v1/admin/listings/{listingId}/delist`
- `POST /api/v1/admin/listings/{listingId}/mark-sold`
- `POST /api/v1/admin/listings/{listingId}/mark-reserved`

### 10.5 Inspection and verification APIs

- `POST /api/v1/admin/listings/{listingId}/inspection-tasks`
- `GET /api/v1/inspectors/inspection-tasks`
- `GET /api/v1/inspectors/inspection-tasks/{taskId}`
- `POST /api/v1/inspectors/inspection-tasks/{taskId}/report`
- `POST /api/v1/admin/listings/{listingId}/ownership-verification`
- `POST /api/v1/admin/listings/{listingId}/inspection-summary/approve`

### 10.6 Quote, vehicle request, and viewing APIs

- `GET /api/v1/admin/quotes`
- `PATCH /api/v1/admin/quotes/{quoteId}`
- `GET /api/v1/admin/vehicle-requests`
- `PATCH /api/v1/admin/vehicle-requests/{requestId}`
- `GET /api/v1/admin/viewings`
- `PATCH /api/v1/admin/viewings/{viewingId}`
- `POST /api/v1/admin/viewings/{viewingId}/confirm`
- `POST /api/v1/admin/viewings/{viewingId}/reschedule`
- `POST /api/v1/admin/viewings/{viewingId}/cancel`
- `POST /api/v1/admin/viewings/{viewingId}/complete`

## 11. Security Plan

Apply the repo security rules directly to the design.

- Use deny-by-default authorization for every controller and service path.
- Use HttpOnly secure cookies for session tokens.
- Require CSRF protection on unsafe cookie-authenticated browser requests.
- Rate-limit login, OTP, password reset, file upload, and buyer inquiry endpoints.
- Keep seller identity documents private at all times.
- Log sensitive actions with actor, entity, outcome, and correlation ID.
- Validate all request payloads and file metadata.
- Prevent direct object reference attacks on listings, documents, appointments, and reports.
- Separate public listing fields from private verification fields at DTO level.
- Track consent acceptance for terms, privacy, seller rules, buyer rules, and no-side-deal warnings.

## 12. Observability and Operations Plan

- JSON structured application logs with correlation IDs.
- Metrics for listing submissions, approval times, upload failures, viewing confirmations, and notification failures.
- Liveness endpoint separate from readiness endpoint.
- Audit feed for every listing, quote, vehicle request, and viewing.
- Admin operational dashboard backed by queue-friendly read models.

## 13. Integration Plan

Launch integrations:

- PostgreSQL
- S3-compatible storage (Tigris in staging/production on Railway; MinIO locally)
- Email provider
- SMS provider
- Redis (Railway managed Redis in staging/production)

Production hosting: Railway for `apps/api`, PostgreSQL, and Redis; Tigris for object storage. See [docs/plan/api/08-production](./plan/api/08-production/plan.md).

Deferred integrations:

- WhatsApp Business
- TIDA partner workflows for import quotations
- Insurance, financing, valuation, and escrow

## 14. Implementation Phases

### Phase 0: Discovery and decision lock

- Finalize roles and permissions.
- Record the CSRF route/header contract before identity implementation.
- Resolve the FRD open decisions.
- Lock the buyer-visible inspection content policy.
- Confirm whether browsing is public or login-gated at detail level.
- Confirm phone-first versus email-first authentication.

### Phase 1: Monorepo and backend foundation

- Create the `blue`-style monorepo skeleton.
- Bootstrap `apps/api`.
- Add PostgreSQL, TypeORM, object storage, Redis, and observability foundations.
- Define shared contracts and error envelope rules.

### Phase 2: Identity, consent, and profile foundation

- Account creation, login, OTP verification, password reset.
- Role model and policy enforcement.
- Buyer and seller profile endpoints.
- Terms and rules acceptance tracking.

### Phase 3: Seller listing workflow

- Listing draft and edit flows.
- Wizard-aligned validation rules for basics, photos, documents, and review.
- Image and document uploads.
- Seller dashboard summaries and status timeline.

### Phase 4: Inspection, verification, and admin approval

- Admin queue and checklist actions.
- Ownership verification workflow.
- Inspection assignment and report upload.
- Admin publish, reject, delist, reserve, and sold actions.

### Phase 5: Buyer marketplace and requests

- Public catalogue search and filters.
- Vehicle detail and buyer-safe inspection summary.
- Saved vehicles.
- Quote requests.
- Vehicle sourcing requests.

### Phase 6: Viewing coordination and notifications

- Buyer viewing request flow.
- Seller confirmation path.
- Admin scheduler and status updates.
- Email and SMS notifications with retry support.

### Phase 7: Hardening and launch readiness

- End-to-end tests for the full trust workflow.
- Security review for private document access.
- Performance checks on catalogue and upload paths.
- Backup and restore validation.
- Admin reporting and operational runbooks.

## 15. Open Decisions to Resolve Before Coding

The FRD already surfaces the highest-value stakeholder decisions. These must be resolved before implementation starts:

- Whether seller contact details are ever shown directly to buyers.
- Whether guests may see listing details or only catalogue summaries.
- Which seller documents are mandatory at MVP launch.
- Which inspection fields are buyer-facing versus internal.
- Whether TIDA import quotations share the same request pipeline or use a separate module.
- Which channels are mandatory at launch: email, SMS, WhatsApp, phone.
- Who is allowed to mark listings as sold, reserved, rejected, or delisted.
- What the no-show and repeat-offender enforcement policy is.

Additional engineering decisions to lock:

- Use NestJS, TypeORM, and PostgreSQL for `apps/api`; keep shared API contracts in `packages/contracts` for web and future mobile clients.
- Keep MVP as a single-tenant operational model. Do not add full SaaS tenant abstraction yet.
- Keep `apps/mobile` reserved in repo shape, but do not implement native flows before the web-first MVP is stable.

## 16. Immediate Next Step After Planning Approval

Once planning is approved, the first delivery slice should be:

1. Create the `blue`-style monorepo scaffold.
2. Bootstrap `apps/api` with NestJS, TypeORM, PostgreSQL, storage, and auth foundations.
3. Implement the seller listing workflow and admin review queue before any advanced marketplace features.
