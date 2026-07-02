# Auto IQ — Project Progress Report

Assessment date: 2026-07-01. Basis: [`docs/plan/web/web-app-plan.md`](./plan/web/web-app-plan.md) (7 phases W0–W7) and the API delivery plan in [`docs/plan/api/`](./plan/api/README.md) (8 phases). MVP scope per the top-level plan: onboarding → seller listing → admin review → inspection → publish → buyer browse → quote/viewing → audit + notifications. **Out of MVP:** payments, escrow, loans, insurance, AV, AI damage, native mobile.

Shape today: 28 web pages, 14 web API route handlers, 19 API modules, 17 API controllers, 34 route entries in `@auto-iq/contracts/routes`, 12 TypeORM migrations, 10 ADRs authored.

---

## Overall progress (at a glance)

| Domain | Status | Notes |
|---|---|---|
| Foundation (W0) | ✅ Done | Server-side session + CSRF proxy, shared UI primitives, format helpers, skeletons |
| Auth & identity (W1) | ✅ Done | Register, OTP, login, forgot/reset — all wired to real endpoints |
| Seller listing wizard (W2) | ⚠️ Partial | 4-step wizard exists; photo + document upload UI **not shipped** |
| Admin operations (W3) | ✅ Mostly done | Dashboard, queue, listing review, viewings + detail. **Inspection capture UI missing** |
| Buyer marketplace (W4) | ⚠️ Partial | Catalogue + detail + quote + viewing done. **Saved list stub; sourcing requests + quotes list missing** |
| Viewings + notifications (W5) | ⚠️ Partial | Viewing request/confirm/reschedule/cancel/complete done. **No notification queue UI, no buyer viewings list** |
| Quality gates (W6) | ❌ Not started | No error.tsx/not-found.tsx; no E2E; no axe audit; no i18n externalisation |
| Production hardening (W7) | ⚠️ Partial | Deployed to Railway staging; Sentry env vars documented but SDK not wired; no security headers/CSP in next.config; no CI beyond typecheck/lint |

---

## Phase-by-phase detail

### W0 — Foundation ✅

Implemented (verified in source):

- Server-side session helpers: `apps/web/lib/server-api.ts`, `remote-api.ts` — `getSessionJson`, `getPublicJson`, `getOptionalSessionJson`, `withQuery`
- CSRF token bootstrap on every proxy route via `issueRemoteCsrfToken`
- Client fetch helpers: `apps/web/lib/web-api.ts` — `getJson`, `postJson`, `putJson`
- Shared UI: `ErrorBanner`, `NoticeBanner`, `EmptyState`, `PageSpinner`, `Skeleton`, `Paginator`, `StepIndicator`, `StatusBadge`
- New this session: `Breadcrumb`, `PaginationFooter`, `FilterChips`, `SiteHeader`, `PageHeader`, `ConfirmDialog`, `ToasterProvider`, `FlashToast`, `StatCard`
- Format helpers: `apps/web/lib/format.ts` (price, date, km)
- `.env.example` documents `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL`, `STORAGE_PUBLIC_BASE_URL`, Sentry vars

Gaps vs plan:
- Plan called for explicit `<AuthProvider>` client context (`hooks/useAuth`) — instead, `MeResponse` is fetched inline on server components. Simpler and works, but the plan's client-side context is absent.
- No `middleware.ts` for edge auth (plan default was `requireRole()` in layouts, which is what we do).

### W1 — Auth & identity ✅

All auth pages exist and are wired to real API endpoints:

- `app/auth/signup/page.tsx` → `POST /api/auth/register`
- `app/auth/otp/page.tsx` → `POST /api/auth/otp/send` + `verify`, auto-resend timer
- `app/auth/login/page.tsx` → `POST /api/auth/login`, mode-aware for admin/user, role-based redirects
- `app/auth/forgot-password/page.tsx` → `POST /api/auth/forgot-password`
- `app/auth/reset-password/page.tsx` → `POST /api/auth/reset-password` with token from URL
- `app/onboarding/page.tsx` — role picker with buyer/seller cards
- `app/onboarding/consents/page.tsx` — exists
- `aria-invalid` set on every auth form field (fix landed this session)

Gaps vs plan:
- `POST /api/auth/logout` route handler is missing. There's no visible logout action anywhere in the web app. **Blocker for production launch.**
- Consent screens exist but I haven't verified they gate the listing wizard.

### W2 — Seller listing wizard ⚠️

Implemented:

- `app/seller/page.tsx` (dashboard) — pulls seller listings from `/api/seller/listings`, shows metrics + recent listings + link to full list
- `app/seller/listings/page.tsx` — full seller listings list with status filter, pagination
- `app/seller/listings/new/page.tsx` — 4-step wizard (Vehicle → Condition → Pricing → Review) → `POST /listings`
- `app/seller/listings/[id]/page.tsx` — seller detail with edit CTA
- `app/seller/listings/[id]/edit/page.tsx` — edit form with PUT proxies for specs + pricing, gated to `DRAFT`/`CHANGES_REQUESTED`

Gaps vs plan:
- **Plan called for a 5-step wizard: Specs → Pricing → Photos → Documents → Review. Photos and Documents steps are entirely missing from the web UI.** The backend has `POST /api/v1/storage/images/presign`, `POST /api/v1/storage/documents/presign`, and `POST /api/v1/listings/:id/images` and `.../documents` for registration — none of them are called from the web. **Sellers cannot upload photos or documents today.** This is a launch blocker.
- No `submit for review` action anywhere in the UI. `ROUTES.listings.submit(id)` exists but the seller flow can't trigger it.
- Listing draft state persistence — the wizard uses component `useState` only, so if the seller navigates away the draft is lost (matches plan but should be revisited pre-launch).

### W3 — Admin operations ✅ mostly

Implemented:

- `app/admin/page.tsx` — Suspense-streamed dashboard with real queue counts
- `app/admin/listings/page.tsx` — moderation queue with search, status filter, pagination, filter chips
- `app/admin/listings/[id]/page.tsx` — admin review page with actions: approve, publish, reject (with confirmation dialog), request-changes; checklist; inspection state read-only
- `app/admin/viewings/page.tsx` — viewing scheduler with filter chips, search, pagination
- `app/admin/viewings/[id]/page.tsx` — new this session — with confirm/reschedule/cancel/complete actions
- `app/admin/login/page.tsx` — role-gated login route
- Admin sidebar layout with mobile drawer

Gaps vs plan:
- **Inspection capture UI is not built.** The plan called for `(admin)/inspections/[id]/page.tsx` with category nav + PASS/WATCH/FAIL toggles + photo capture. Today `app/admin/inspections/page.tsx` is a stub explaining that inspection state lives on the listing. `ROUTES.inspectors.taskDetail(id)` isn't wired. If inspectors capture reports externally, this may be OK; if BiSell staff capture on-platform, this is a blocker.
- `POST /admin/listings/:id/inspection-summary/approve` and `POST /admin/listings/:id/inspection-tasks` are exposed by contracts but not wired into the UI.
- Admin stubs (`users`, `settings`, `requests`, `reports`) — demoted to "In progress" section with a Soon badge. Fine for MVP; empty pages if clicked.
- No SWR polling for live dashboard counts (plan wanted 30s revalidation). Data is fetched fresh on navigation; no auto-refresh.

### W4 — Buyer marketplace ⚠️

Implemented:

- `app/(marketplace)/vehicles/page.tsx` — new Alibaba-style catalogue with left sidebar filters (make, city, body type, price/year/mileage ranges, transmission, fuel, verification), dense card grid, cursor pagination, active filter chips, guest hero with sign-in/register CTAs
- `app/(marketplace)/vehicles/[id]/page.tsx` — detail with inspection summary, spec grid, seller disclosure, contact-redaction banner for guests, `VehicleInterestPanel` for buyer actions
- `app/page.tsx` — redirects to `/vehicles` (homepage is the catalogue)
- `app/(marketplace)/layout.tsx` — global nav with mobile drawer
- Quote submission wired via `VehicleInterestPanel` → `POST /api/buyer/quotes/:listingId`

Gaps vs plan:
- **`app/saved/page.tsx` is a stub.** `POST/DELETE /api/v1/me/saved-vehicles/:id` exists on the API but no save action anywhere in the web UI. The heart icon on the vehicle card doesn't do anything. Save-vehicle loop is completely disconnected.
- **`app/quotes/page.tsx` doesn't exist.** Buyers can submit a quote from the detail page but have no list view. `ROUTES.quotes.buyerList` returns `/me/quotes` — unused.
- **`app/vehicle-requests/page.tsx` and `.../new/page.tsx` don't exist.** Sourcing request flow entirely missing. `ROUTES.vehicleRequests.create` and `.buyerList` exposed but not called.
- **`app/profile/page.tsx` doesn't exist.** Buyers can't view or edit their profile.
- No pagination-back navigation restoration for cursor-based lists (per-list session was addressed for offset lists only).

### W5 — Viewings & notifications ⚠️

Implemented:

- Buyer viewing request via `VehicleInterestPanel` → `POST /api/buyer/viewings/:listingId`
- Admin viewing detail with confirm / reschedule / cancel (with confirmation dialog) / complete
- Reference data (approved viewing locations) fetched conditionally on buyer detail page

Gaps vs plan:
- **`app/viewings/page.tsx` (buyer viewings list) doesn't exist.** Buyers cannot see the status of their own viewing requests.
- **`app/(admin)/notifications/page.tsx` doesn't exist.** `ROUTES.admin.notifications` and `.notificationRetry` are exposed but no UI to see delivery status or trigger retries.
- No notification status badge on viewing cards.

### W6 — Quality gates ❌

- **No `error.tsx` anywhere.** Route errors show Next.js default.
- **No `not-found.tsx` at app root or in any group.**
- **No `global-error.tsx`.**
- **No E2E tests.** No `playwright.config.ts`, no `e2e/` directory in `apps/web`. `pnpm test` in `apps/web` is a no-op.
- **No axe / Lighthouse audit run.** The `docs/plan/api/reference/frontend-quality.md` gates exist but haven't been enforced in CI.
- **No i18n externalisation.** All strings hard-coded. `LISTING_STATUS_LABELS` map inlined into individual pages rather than centralised.
- **No perf audit / bundle analysis.**
- **`next/image` uses `unoptimized` was removed this session**; `remotePatterns` tightening via env is now in `next.config.ts`.

### W7 — Production hardening ⚠️

- Railway deploy exists for staging; production not confirmed
- `next.config.ts` — has `output: standalone`, image remote patterns, but **no `headers()` block** with HSTS / X-Frame-Options / X-Content-Type-Options / CSP
- **No Sentry SDK wired in `apps/web`.** Env vars are documented; imports and `Sentry.ErrorBoundary` are not present.
- **CI:** GitHub Actions folder exists (`.github/`) but I have not verified the workflow content in this pass. Assumption: typecheck + lint pass; no E2E; no Lighthouse.
- `SESSION_COOKIE_SECURE`, `CORS_ORIGINS`, `WEB_BASE_URL` documented but production values not staged (per the go-live checklist template which is empty).
- Go-live checklist template (`docs/operations/go-live-checklist.md`) exists but is **entirely unchecked**.

---

## What still stands between us and the MVP launch

Ordered by launch-blocking severity.

### Must ship before MVP go-live

1. **Photo + document upload UI on the seller listing wizard.** Sellers currently cannot publish a listing because they can't attach photos or ownership documents. Requires: `PhotoUploader`, `DocumentUploader`, presign → S3 PUT → register flow. Backend endpoints exist.
2. **Submit-for-review action on the seller detail page.** `ROUTES.listings.submit(id)` unused; no button.
3. **Save vehicle action.** Heart icon must call `POST/DELETE /me/saved-vehicles/:id`; `/saved` page must render the saved list.
4. **Buyer quotes list at `/quotes`.** So buyers can track their own offers.
5. **Buyer viewings list at `/viewings`.** So buyers can see status of requested viewings.
6. **Logout.** No logout button anywhere. Session lives forever.
7. **`error.tsx` and `not-found.tsx`.** Public site currently shows Next.js default errors.
8. **Security headers + CSP.** Basic HSTS / X-Frame-Options / X-Content-Type-Options.
9. **Sentry SDK wiring.** Not just env vars — `@sentry/nextjs` in `layout.tsx`, source maps in build.
10. **Go-live checklist walkthrough.** Every checkbox in `docs/operations/go-live-checklist.md` must be completed.

### Should ship before MVP go-live

11. **Vehicle sourcing requests** (buyer creates → admin reviews). Full flow missing.
12. **Buyer profile edit** at `/profile`.
13. **Inspection capture UI** at `/admin/inspections/[id]` if BiSell staff will run inspections in-app. If they're using an external tool and just uploading the summary, this can be deferred.
14. **Admin notification queue** at `/admin/notifications` for retrying failed sends.
15. **At least one E2E flow tested via Playwright** — recommend register → OTP → login → dashboard as the minimum smoke.
16. **`aria-live` regions on all form submissions.** Screen readers need to hear success/error state.

### Post-MVP polish

17. i18n externalisation
18. SWR polling on admin dashboard
19. Photo uploader reorder / delete UX
20. Full Playwright suite (6 flows listed in the plan)
21. Lighthouse CI target of ≥ 95 Accessibility
22. Complete the deferred audit items from `docs/production-readiness-audit.md` (per-card Suspense trend deltas, unfinished admin stubs, tabs on detail pages)

---

## Backend side (quick sanity check)

I did not deep-audit `apps/api` this pass. But at a glance:

- 19 modules cover the domain (identity, listings, listing-media, listing-documents, viewings, quotes, inspections, admin-ops, notifications, ownership-verification, buyer-profiles, seller-profiles, reference-data, accounts, storage, vehicle-requests, audit, redis, health)
- 17 controllers means most modules have an HTTP surface
- 34 route entries in the contracts package suggest the API surface tracked in `@auto-iq/contracts` is broad
- 12 migrations landed — schema has been evolving

Suggested backend audit before launch:
- Verify every `ROUTES.*` entry is claimed by an API controller (`packages/contracts` vs `apps/api` cross-check)
- Verify RBAC on every route matches `docs/plan/api/reference/route-permissions.md`
- Run the go-live smoke script (`scripts/smoke-remote.sh`) against staging
- Confirm all 12 migrations run cleanly against a fresh DB

---

## Green / yellow / red summary

| Colour | Item |
|---|---|
| 🟢 | Foundation, Auth, Admin listings + viewings, Buyer catalogue browse & detail |
| 🟡 | Seller wizard (missing uploads), Buyer quotes/viewings/saved (no lists), Contact redaction (works via API but no post-contact flow yet) |
| 🔴 | Photo/document upload, Logout, Save action, error.tsx, not-found.tsx, Sentry, security headers, E2E, sourcing requests, inspection capture, notification queue |

**Honest bottom line:** we're at roughly **65–70% of the plan's MVP scope** by feature count. What's shipped is production-quality (typechecked, linted, filter-chipped, breadcrumbed, toast-notified, contact-gated), but the remaining 30–35% includes several unambiguous launch blockers — sellers can't upload photos, users can't log out, buyers can't save vehicles or see their own quotes/viewings. Realistically we're **still 1–2 focused sprints from Gate 1 of the go-live checklist**.
