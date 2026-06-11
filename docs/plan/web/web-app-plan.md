# BiSell AutoIQ — Web App Build Plan

**App:** `apps/web` (Next.js 16, App Router)  
**Contracts:** `packages/contracts` (`@auto-iq/contracts`)  
**Audience:** Engineering team  
**Date:** 2026-06-10

---

## 1. Current state

The UI scaffold is complete. Every screen has been built as static markup connected to the design system. What is not yet done is any live data — there is no API client instantiation, no auth session, no server actions, and no real state management. The build roadmap below tracks the journey from this static scaffold to a fully integrated, production-ready application.

### What exists

| Layer | Status | Notes |
|---|---|---|
| Design tokens (Tailwind config, CSS vars) | ✅ Done | `apps/web/tailwind.config.ts`, `globals.css` |
| Shared UI components | ✅ Done | `CarSilhouette`, `ScoreGauge`, `StatusBadge`, `BiSellLogo` |
| Admin shell + 4 admin screens | ✅ Done | `(admin)/` route group |
| Marketplace, vehicle detail | ✅ Done | `(marketplace)/` route group |
| Seller dashboard | ✅ Done | `app/seller/page.tsx` |
| Onboarding role picker | ✅ Done | `app/onboarding/page.tsx` |
| Sign-up screen | ✅ Done | `app/auth/signup/page.tsx` |
| `@auto-iq/contracts` package | ✅ Done | 17 typed modules + `ApiClient` + `ROUTES` |
| Web tsconfig path alias | ✅ Done | `@auto-iq/contracts` → `packages/contracts/src/index.ts` |

### What is missing

- Auth session (cookie-based HttpOnly, CSRF bootstrap)
- `ApiClient` singleton and React context/hooks
- Server Actions / Route Handlers for data mutations
- Real data on every screen (all static placeholders)
- Login, OTP, forgot-password, and reset-password screens
- Seller listing wizard (multi-step create/edit flow)
- Buyer profile, saved vehicles, quotes, vehicle requests
- Admin login screen (admin-specific auth gate)
- File upload flow (presign → direct S3 PUT → register)
- Pagination on all list views
- Error boundaries, loading skeletons, empty states
- Accessibility audit pass
- i18n string externalisation
- E2E tests (Playwright)
- CI pipeline integration

---

## 2. Architecture

### Routing structure

```
app/
├── (admin)/               ← Admin route group (role guard: ADMIN)
│   ├── layout.tsx         ← AdminShell wrapper
│   ├── page.tsx           ← Dashboard overview
│   ├── listings/[id]/     ← Listing review & moderation
│   ├── inspections/[id]/  ← Inspection capture
│   └── viewings/          ← Viewing scheduler
│
├── (marketplace)/         ← Public/buyer route group
│   ├── layout.tsx         ← Marketplace nav
│   ├── page.tsx           ← Browse catalogue
│   └── vehicles/[id]/     ← Vehicle detail + CTA
│
├── auth/
│   ├── login/             ← Login screen (to build)
│   ├── signup/            ← Register (exists, needs wiring)
│   ├── otp/               ← OTP verification (to build)
│   ├── forgot-password/   ← Forgot password (to build)
│   └── reset-password/    ← Reset password (to build)
│
├── seller/                ← Seller dashboard (exists, needs wiring)
│   └── listings/
│       ├── new/           ← Listing wizard (to build)
│       └── [id]/edit/     ← Edit existing listing (to build)
│
├── onboarding/            ← Role picker (exists, needs wiring)
│   └── consents/          ← Consent screens (to build)
│
└── profile/               ← User profile / settings (to build)
```

### Data fetching strategy

| Pattern | Used for | Location |
|---|---|---|
| RSC (Server Components) | Initial page loads, SEO-critical data (catalogue, vehicle detail) | `page.tsx` files in `(marketplace)/` |
| Server Actions | All mutations (login, submit listing, confirm viewing, etc.) | `app/actions/` directory |
| Client Components + SWR | Polling / live-updating UI (admin dashboard counts, notifications) | `"use client"` components with `useSWR` |
| Route Handlers | OAuth callbacks, CSRF bootstrap, presign relay if needed | `app/api/` directory |

### Auth session architecture

The web app uses HttpOnly cookie sessions per [ADR-0001](../api/adr/0001-web-auth-and-csrf.md):

1. `GET ROUTES.auth.csrf` (anonymous) → `CsrfResponse` — called once on app boot, stored in React context
2. All `POST`/`PATCH`/`PUT`/`DELETE` calls include `X-CSRF-Token` header via `ApiClient.getCsrfToken`
3. `credentials: 'include'` on all `ApiClient` fetch calls (already configured in `client.ts`)
4. On 401: `onUnauthorized` triggers `POST ROUTES.auth.refresh` (cookie-based) → retry once

### State management

| Concern | Tool |
|---|---|
| Server session / user identity | React Context (`AuthContext`) — populated by `GET /me` in root layout |
| Reference data (makes, body types, etc.) | SWR with long TTL; fetched once in `ReferenceDataProvider` |
| Listing wizard draft | React state + `useReducer` — no persistence needed between sessions |
| Admin queue counts | SWR with 30s revalidation |
| Mutations | Server Actions with `useFormState` / `useTransition` |

### Directory conventions

```
apps/web/
├── app/                   ← Next.js App Router pages and layouts
│   ├── actions/           ← Server Actions (auth.ts, listings.ts, admin.ts, etc.)
│   └── api/               ← Route Handlers (csrf.ts, health.ts, upload-relay.ts)
├── components/
│   ├── ui/                ← Dumb presentational atoms (existing)
│   ├── admin/             ← Admin-specific components (AdminShell existing)
│   ├── listing/           ← Listing wizard steps, listing cards
│   ├── marketplace/       ← Catalogue grid, filter bar, vehicle card
│   ├── auth/              ← Auth forms, OTP input
│   └── shared/            ← Pagination, error boundaries, skeletons
├── hooks/                 ← Custom React hooks (useAuth, useListing, useCatalogue)
├── lib/
│   ├── api-client.ts      ← Singleton ApiClient instance + provider
│   ├── auth.ts            ← Session helpers (getSession, requireRole)
│   ├── format.ts          ← Price, date, km, phone formatters
│   └── utils.ts           ← clsx/twMerge helper (existing)
└── types/                 ← Web-local types not in contracts (form state, UI state)
```

---

## 3. Phase roadmap

Each phase maps to one backend API phase and can only be fully wired once the corresponding backend phase is deployed. The UI scaffold and static versions can (and should) be completed ahead of the backend.

---

### Phase W0 — Foundation (no backend required)

**Goal:** All infrastructure plumbing in place before any screen touches real data.

**Tasks:**

1. **`lib/api-client.ts`** — create singleton `ApiClient` with:
   - `baseUrl` from `NEXT_PUBLIC_API_URL` env
   - `credentials: 'include'`
   - `getCsrfToken` reads from `CsrfContext`
   - `onUnauthorized` calls `POST ROUTES.auth.refresh` and retries

2. **`lib/auth.ts`** — server-side session helpers:
   - `getSession()` — calls `GET ROUTES.me.profile` from a Server Component, returns `MeResponse | null`
   - `requireRole(role)` — redirects to `/auth/login` if no session or wrong role
   - `requireAuth()` — wraps `requireRole` for any authenticated route

3. **`app/api/csrf/route.ts`** — Route Handler that proxies `GET ROUTES.auth.csrf` and sets the CSRF token in a readable (non-HttpOnly) cookie so client components can read it

4. **`components/shared/`** — build once, reuse everywhere:
   - `<Skeleton />` — animated shimmer block
   - `<PageSpinner />` — centered full-height spinner
   - `<ErrorBanner error={ApiError} />` — amber/reject banner with `correlationId`
   - `<EmptyState icon headline body cta />` — for empty lists
   - `<Paginator page total limit onChange />` — offset pagination controls

5. **`lib/format.ts`**:
   - `formatPrice(cents)` → `ZWG 240,000`
   - `formatKm(km)` → `48 500 km`
   - `formatDate(iso)` → `10 Jun 2026`
   - `formatPhone(e164)` → `+263 77 123 4567`

6. **`hooks/useAuth.ts`** — client-side hook reading `AuthContext`; returns `{ user, isLoading, isAdmin, isSeller, isBuyer }`

7. **Environment variables** — document in `.env.example`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_ENV=development
   ```

**Exit criteria:** `ApiClient` instantiates without errors; `getSession()` returns null gracefully; all shared components render correctly with placeholder props; `pnpm typecheck` passes.

---

### Phase W1 — Auth & Identity (backend Phase 2)

**Goal:** Users can register, verify their phone, log in, and reach their role-appropriate home.

**New screens to wire:**

| Screen | File | Notes |
|---|---|---|
| Login | `app/auth/login/page.tsx` | Email + password; redirect by role after login |
| OTP verify | `app/auth/otp/page.tsx` | 6-digit input; resend timer |
| Forgot password | `app/auth/forgot-password/page.tsx` | Email input only |
| Reset password | `app/auth/reset-password/page.tsx` | Token from URL query; new password |

**Screens to wire (already exist):**

| Screen | Required wiring |
|---|---|
| Sign-up (`auth/signup/page.tsx`) | Server Action → `POST ROUTES.auth.register`; on `otpRequired` redirect to `/auth/otp` |
| Onboarding role picker (`onboarding/page.tsx`) | After register redirect; sets `role` in register payload |
| Consents (`onboarding/consents/`) | `POST ROUTES.me.consents` per consent type; block listing wizard until complete |

**Server Actions to create (`app/actions/auth.ts`):**
```typescript
registerAction(FormData)     → ROUTES.auth.register
loginAction(FormData)        → ROUTES.auth.login
logoutAction()               → ROUTES.auth.logout
sendOtpAction(FormData)      → ROUTES.auth.sendOtp
verifyOtpAction(FormData)    → ROUTES.auth.verifyOtp
forgotPasswordAction(FormData) → ROUTES.auth.forgotPassword
resetPasswordAction(FormData)  → ROUTES.auth.resetPassword
recordConsentAction(type, version) → ROUTES.me.consents
```

**Root layout changes (`app/layout.tsx`):**
- Wrap with `<AuthProvider>` that calls `getSession()` on the server, passes `MeResponse | null` into context
- `<AuthProvider>` bootstraps CSRF token on mount via `GET /api/csrf`

**Role-based redirects:**

| Role | Post-login destination |
|---|---|
| `BUYER` | `/(marketplace)` |
| `SELLER` | `/seller` |
| `ADMIN` | `/(admin)` |
| `INSPECTOR` | `/inspector/tasks` (future) |

**Error codes to handle per-screen:**
- `INVALID_CREDENTIALS` → "Invalid email or password"
- `OTP_INVALID`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS` → inline field errors
- `RATE_LIMITED` → banner with retry-after
- `VALIDATION_FAILED` → `FieldError[]` mapped to form fields

**Exit criteria:** Full register → OTP → login → dashboard flow works end-to-end; logout clears session; `requireAuth()` redirects unauthenticated users; 401 triggers cookie refresh and retries once.

---

### Phase W2 — Seller Listing Wizard (backend Phase 3)

**Goal:** Sellers can create, edit, upload photos/documents, and submit a listing.

**New screens:**

| File | Screen |
|---|---|
| `app/seller/listings/new/page.tsx` | Wizard entry — Step 1: Vehicle specs |
| `app/seller/listings/new/pricing/page.tsx` | Step 2: Pricing & disclosure |
| `app/seller/listings/new/photos/page.tsx` | Step 3: Photo upload |
| `app/seller/listings/new/documents/page.tsx` | Step 4: Documents |
| `app/seller/listings/new/review/page.tsx` | Step 5: Review & submit |
| `app/seller/listings/[id]/edit/` | Same 5 steps, pre-populated |

**Components to build (`components/listing/`):**

- `<WizardProgress steps currentStep />` — 5-step progress bar
- `<SpecsForm initialValues onSave />` — make, model, year, odometer, body type, fuel, transmission, drive, condition, VIN, colour
- `<PricingForm initialValues onSave />` — asking price, flexible flag, payment plan, seller disclosure text
- `<PhotoUploader listingId onComplete />` — drag-and-drop; presign → S3 PUT → register; up to 20 photos; reorder grid
- `<DocumentUploader listingId type onComplete />` — presign flow; document type enum select
- `<ListingReviewCard listing />` — summary before submit; shows checklist of mandatory docs

**Server Actions (`app/actions/listings.ts`):**
```typescript
createListingAction()                         → ROUTES.listings.create
upsertSpecsAction(listingId, FormData)        → ROUTES.listings.upsertSpecs(id)
upsertPricingAction(listingId, FormData)      → ROUTES.listings.upsertPricing(id)
presignImageAction(listingId, contentType)    → ROUTES.storage.imagePresign
registerImageAction(listingId, storageKey, slot) → ROUTES.storage.registerImage(id)
presignDocumentAction(listingId, contentType, type) → ROUTES.storage.documentPresign
registerDocumentAction(listingId, storageKey, type) → ROUTES.storage.registerDocument(id)
submitListingAction(listingId)                → ROUTES.listings.submit(id)
```

**Seller dashboard wiring (`app/seller/page.tsx`):**
- Replace static data with `GET ROUTES.listings.list` (paginated, `SellerListingSummaryDto[]`)
- Show `CHANGES_REQUESTED` alert bar per listing — link to edit wizard at step with flagged section
- Show `SUBMITTED` / `IN_REVIEW` / `PUBLISHED` status badges live

**Reference data:**
- Fetch `GET ROUTES.referenceData.all` in `ReferenceDataProvider` (at seller layout level)
- Populate make, body type, fuel type, transmission, drive type dropdowns in the wizard

**File upload flow detail:**
1. Client calls `presignImageAction` → returns `{ uploadUrl, storageKey, expiresAt }`
2. Client does `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': mime } })` directly — no API auth headers
3. Client calls `registerImageAction` with `storageKey` and slot name → `VehicleImageDto`
4. Show thumbnail; allow reorder / delete

**Exit criteria:** Seller can complete the full wizard; photos and documents upload via presigned URLs; submitted listing appears in dashboard with status `SUBMITTED`; `CHANGES_REQUESTED` listings display the changes note and link back to edit.

---

### Phase W3 — Admin Operations (backend Phase 4)

**Goal:** Admin can review, approve, inspect, and publish listings; manage viewing scheduler.

**Screens to wire (all exist as static):**

| Screen | Data to connect |
|---|---|
| `(admin)/page.tsx` | `GET ROUTES.admin.dashboard` → `AdminDashboardDto`; live queue counts |
| `(admin)/listings/[id]/page.tsx` | `GET ROUTES.admin.listing(id)` → `AdminListingDto`; action buttons wired |
| `(admin)/inspections/[id]/page.tsx` | `GET ROUTES.inspectors.taskDetail(id)` → `InspectionReportDto`; submit report |
| `(admin)/viewings/page.tsx` | `GET ROUTES.admin.viewings` → `ViewingDto[]`; week-grid populated |

**New admin screens:**

| File | Screen |
|---|---|
| `app/(admin)/listings/page.tsx` | Listing queue — paginated, filterable by status |
| `app/(admin)/login/page.tsx` | Admin login (separate route; same auth flow but validates `ADMIN` role) |

**Server Actions (`app/actions/admin.ts`):**
```typescript
requestChangesAction(listingId, message)     → ROUTES.admin.listingRequestChanges(id)
approveListingAction(listingId)              → ROUTES.admin.listingApprove(id)
publishListingAction(listingId)              → ROUTES.admin.listingPublish(id)
rejectListingAction(listingId, reason)       → ROUTES.admin.listingReject(id)
delistListingAction(listingId, reason)       → ROUTES.admin.listingDelist(id)
createInspectionTaskAction(listingId, data)  → ROUTES.admin.listingCreateInspectionTask(id)
submitInspectionReportAction(taskId, report) → ROUTES.inspectors.submitReport(id)
approveSummaryAction(listingId)              → ROUTES.admin.listingApproveSummary(id)
confirmViewingAction(viewingId, data)        → ROUTES.admin.viewingConfirm(id)
rescheduleViewingAction(viewingId, data)     → ROUTES.admin.viewingReschedule(id)
cancelViewingAction(viewingId, reason)       → ROUTES.admin.viewingCancel(id)
completeViewingAction(viewingId)             → ROUTES.admin.viewingComplete(id)
```

**Admin shell updates:**
- Replace hardcoded badge counts with live counts from `AdminDashboardDto.queues`
- SWR poll every 30 seconds for dashboard counts
- Add filter/sort controls to listing queue (status chip filter, date sort)

**Inspection capture screen:**
- Category nav on left drives scroll-to-section on right
- PASS/WATCH/FAIL toggle writes to local form state; single submit via `submitInspectionReportAction`
- Camera icon opens `<input type="file" accept="image/*" capture="environment">` with presign upload
- Overall score computed client-side as weighted average; `ScoreGauge` updates live

**Viewing scheduler:**
- Week grid populated from `GET ROUTES.admin.viewings` filtered by `dateFrom`/`dateTo`
- Each viewing card shows participant names, listing title, status badge
- Click on card opens detail drawer with action buttons (confirm / reschedule / cancel / complete)

**Exit criteria:** Admin can take a listing from `SUBMITTED` → `PUBLISHED` via the full moderation flow; inspection score is captured and submitted; viewing calendar shows real appointments with functional action buttons.

---

### Phase W4 — Buyer Marketplace (backend Phase 5)

**Goal:** Buyers can browse published listings, view detail, save vehicles, submit quotes, and request sourcing.

**Screens to wire (all exist as static):**

| Screen | Data to connect |
|---|---|
| `(marketplace)/page.tsx` | `GET ROUTES.catalogue.list` with `CatalogueFilters`; cursor pagination |
| `(marketplace)/vehicles/[id]/page.tsx` | `GET ROUTES.catalogue.detail(id)`; inspection summary; CTA actions |

**New buyer screens:**

| File | Screen |
|---|---|
| `app/profile/page.tsx` | Buyer/seller profile view and edit |
| `app/saved/page.tsx` | Saved vehicles list |
| `app/quotes/page.tsx` | Buyer quote list |
| `app/vehicle-requests/page.tsx` | Sourcing requests list |
| `app/vehicle-requests/new/page.tsx` | New sourcing request form |

**Components to build (`components/marketplace/`):**

- `<CatalogueGrid listings isLoading />` — responsive 2–3 col grid; skeleton on load
- `<FilterBar filters onChange />` — make, price range, year range, body type pills, fuel type, transmission; collapses to drawer on mobile
- `<VehicleCard listing />` — image/silhouette, price, make/model/year, odometer, score badge
- `<InspectionSummaryCard summary />` — category breakdown table + overall `ScoreGauge`
- `<QuoteForm listingId onSuccess />` — offer price, payment plan select, notes
- `<VehicleRequestForm onSuccess />` — sourcing request fields (budget, make, urgency, etc.)
- `<SaveButton listingId isSaved />` — heart toggle; optimistic update

**Server Actions (`app/actions/buyer.ts`):**
```typescript
saveVehicleAction(listingId)               → POST ROUTES.me.savedVehicle(id)
unsaveVehicleAction(listingId)             → DELETE ROUTES.me.savedVehicle(id)
createQuoteAction(listingId, FormData)     → POST ROUTES.quotes.create(id)
createVehicleRequestAction(FormData)       → POST ROUTES.vehicleRequests.create
```

**Catalogue RSC fetch:**
- `(marketplace)/page.tsx` is a Server Component; fetches `catalogue.list` with initial default filters
- Filter changes trigger client-side re-fetch via `useRouter.push` with updated query params, which trigger a Server Component re-render
- Cursor is stored in URL (`?cursor=xyz`) so deep links and back-button work correctly

**Vehicle detail page:**
- Server Component fetches `catalogue.detail(id)` and renders the full detail view
- `GET catalogue.inspectionSummary(id)` is fetched separately (conditional on `BUYER_SUMMARY_APPROVED`)
- CTA bar at bottom: "Request Viewing" (opens modal → Phase W5), "Make an Offer" (opens `<QuoteForm />`), "Save" (client component)

**Exit criteria:** Published listings appear in catalogue with real photos and scores; filters narrow results correctly; buyer can save a vehicle and see it in `/saved`; quote and vehicle request submit and appear in admin queue.

---

### Phase W5 — Viewings & Notifications (backend Phase 6)

**Goal:** Buyers can request viewings; sellers and admins coordinate; notification status visible.

**New screens:**

| File | Screen |
|---|---|
| `app/viewings/page.tsx` | Buyer viewings list — status timeline |
| `app/(admin)/notifications/page.tsx` | Admin notification queue — retry controls |

**New components:**

- `<ViewingRequestModal listingId approvedLocations />` — date/time picker + location select; submits `RequestViewingRequest`
- `<ViewingCard viewing />` — status pill, participants, location, time; actions (cancel for buyer)
- `<ViewingTimeline viewing />` — status history with timestamps
- `<NotificationRow notification />` — channel badge, template, status, attempt count; retry button

**Server Actions (`app/actions/viewings.ts`):**
```typescript
requestViewingAction(listingId, FormData)   → POST ROUTES.viewings.create(id)
cancelViewingAction(viewingId)              → POST ROUTES.admin.viewingCancel(id)  // buyer cancel via own route (Phase 6 TBD)
retryNotificationAction(notificationId)     → POST ROUTES.admin.notificationRetry(id)
```

**Admin viewing scheduler updates:**
- Week grid already built; add "Add Viewing" button for admin-initiated scheduling
- Notification status badge on each viewing card (sent / pending / failed)

**Exit criteria:** Buyer can submit a viewing request from the vehicle detail page; request appears in admin scheduler; notification delivery status is visible in admin notification queue.

---

### Phase W6 — Quality Gates

**Goal:** The app is accessible, internationalised, observable, and tested before production.

#### Accessibility (every screen)

Per [frontend-quality.md](./api/reference/frontend-quality.md):
- Audit with `axe-core` in Playwright tests; zero `critical` violations allowed
- All form inputs have associated `<label>` or `aria-label`
- Focus ring visible on all interactive controls (Tailwind `focus-visible:ring` pattern)
- Status changes announced via `aria-live="polite"` regions
- `CarSilhouette`, `ScoreGauge` SVG marked `aria-hidden` or given `role="img" aria-label`
- Colour contrast: ink-900 on white ≥ 7:1; amber on ink-900 ≥ 3:1 (verify with `@radix-ui/colors` tool)

#### Internationalisation

- Move all user-facing strings to `lib/copy.ts` (or a future `next-intl` setup)
- Shared formatters in `lib/format.ts` used everywhere (no inline `toLocaleString`)
- Status label maps: `LISTING_STATUS_LABELS`, `VIEWING_STATUS_LABELS`, etc.
- No assumptions about text length in flex/grid layouts

#### Error handling

- Every page has an `error.tsx` boundary returning a user-friendly message with a "Go back" link
- `loading.tsx` files in each route segment for streaming suspense
- `not-found.tsx` at app root and within `(admin)` group
- `ApiError` surfaces: code, translated message, and `correlationId` (copyable for support)

#### Performance

- Dynamic import for heavy components (`<PhotoUploader />`, `<WeekGrid />`) with `{ ssr: false }` where appropriate
- Images served via Next.js `<Image />` with correct `sizes` and `priority` on hero
- Route prefetching for the seller wizard steps (link `prefetch={true}`)
- Lighthouse CI score targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 90

#### E2E tests (Playwright)

Test files in `apps/web/e2e/`:

| Test file | Scenarios |
|---|---|
| `auth.spec.ts` | Register → OTP → login → logout; forgot password flow; 401 triggers refresh |
| `seller-listing.spec.ts` | Full wizard; photo upload; submit → status SUBMITTED |
| `admin-review.spec.ts` | Review listing → request changes → approve → publish |
| `catalogue.spec.ts` | Browse with filters; open detail; inspection summary visible |
| `buyer-quote.spec.ts` | Submit quote from detail page; appears in admin quote queue |
| `viewing.spec.ts` | Request viewing; admin confirms; buyer sees CONFIRMED |

---

### Phase W7 — Production Hardening & Deployment (backend Phase 8)

**Goal:** App is deployed on Railway, monitored, and ready for real users.

#### Environment configuration

```
# .env.production (Railway env vars)
NEXT_PUBLIC_API_URL=https://api.autoiq.co.zw
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...        # used at build time for source maps
```

#### Sentry integration

- `@sentry/nextjs` — wrap `layout.tsx` with `Sentry.ErrorBoundary`
- Source maps uploaded in `next build` CI step
- `correlationId` attached to all Sentry error events: `Sentry.setTag('correlationId', error.correlationId)`

#### Next.js config hardening

- `headers()` in `next.config.ts` — add `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- CSP header in `next.config.ts` — restrict `script-src` and `connect-src` to known origins
- `images.domains` configured for S3/Tigris storage domain

#### CI pipeline (GitHub Actions)

```yaml
# .github/workflows/web.yml steps
- pnpm install
- pnpm typecheck          # tsc --noEmit
- pnpm lint               # eslint
- pnpm test:e2e           # playwright (against staging API)
- pnpm build              # next build
- lighthouse-ci           # performance / accessibility scores
```

#### Railway deployment

- `apps/web` deployed as a Railway service
- `NEXT_PUBLIC_API_URL` set to the `apps/api` Railway service URL (injected as Railway variable reference)
- Health check on `GET /` (200)
- Zero-downtime deploys via Railway's rolling restart

**Exit criteria:** `pnpm build` succeeds with no errors; Lighthouse Accessibility ≥ 95; all Playwright E2E tests pass against staging; Sentry receives an error event from a test throw; Railway service is live at production URL.

---

## 4. Component inventory

### Built (static scaffold)

| Component | File | Needs wiring |
|---|---|---|
| `AdminShell` | `components/admin/admin-shell.tsx` | Badge counts from `AdminDashboardDto` |
| `CarSilhouette` | `components/ui/car-silhouette.tsx` | None — presentational only |
| `ScoreGauge` | `components/ui/score-gauge.tsx` | None — presentational only |
| `StatusBadge` | `components/ui/status-badge.tsx` | None |
| `BiSellLogo` | `components/ui/bisell-logo.tsx` | None |

### To build (grouped by phase)

**Phase W0 — Foundation**
- `Skeleton`, `PageSpinner`, `ErrorBanner`, `EmptyState`, `Paginator`

**Phase W1 — Auth**
- `LoginForm`, `RegisterForm`, `OtpInput`, `ForgotPasswordForm`, `ResetPasswordForm`, `ConsentCard`

**Phase W2 — Seller**
- `WizardProgress`, `SpecsForm`, `PricingForm`, `PhotoUploader`, `DocumentUploader`, `ListingReviewCard`, `ListingCard` (seller variant)

**Phase W3 — Admin**
- `ListingQueueTable`, `ModerationChecklist`, `InspectionCategoryNav`, `FindingToggle`, `ViewingDetailDrawer`, `AdminActionConfirmModal`

**Phase W4 — Buyer Marketplace**
- `CatalogueGrid`, `FilterBar`, `VehicleCard`, `InspectionSummaryCard`, `QuoteForm`, `VehicleRequestForm`, `SaveButton`

**Phase W5 — Viewings**
- `ViewingRequestModal`, `ViewingCard`, `ViewingTimeline`, `NotificationRow`

---

## 5. Design system reference

### Colour tokens

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#0A1E4D` | Primary background (navy), headings |
| `ink-600` | `#1E3A7A` | Sidebar active bg, secondary nav |
| `ink-400` | `#4A6FA5` | Muted labels |
| `ink-100` | `#D4DFF2` | Borders, dividers |
| `ink-50` | `#EEF2FA` | Page background |
| `amber.DEFAULT` | `#FFC72C` | Primary CTA, active indicators |
| `amber.dark` | `#E6A800` | Hover state for amber |
| `ember` | `#F47B20` | Warnings, side-deal alerts |
| `verified.DEFAULT` | `#1F7A4C` | PASS findings, published status |
| `pending.DEFAULT` | `#B45309` | WATCH findings, in-review status |
| `reject.DEFAULT` | `#9B1C1C` | FAIL findings, rejected status |

### Typography scale

| Class | Font | Size / Weight | Use |
|---|---|---|---|
| `.display` | Bricolage Grotesque | `text-3xl font-semibold` | Page headings, hero text |
| body default | Geist | `text-sm` / `text-base` | All body copy |
| `.mono` | Geist Mono | `text-sm font-medium tabular-nums` | Prices, odometer, VIN, scores |

### Utility classes (from `globals.css`)

| Class | Description |
|---|---|
| `.btn-amber` | Primary amber CTA button |
| `.btn-ink` | Navy solid button |
| `.btn-ghost` | Transparent with hover state |
| `.btn-outline` | White outline on navy backgrounds |
| `.badge` | Status chip with `.badge-dot` indicator |
| `.car-stage` | Navy rounded container for `CarSilhouette` |
| `.tbl` | Styled table (full-width, border-separated) |
| `.progress-seg` | Pipeline funnel segment |

---

## 6. Open decisions

| # | Question | Impact | Default if not resolved |
|---|---|---|---|
| W-1 | Server Actions vs. API Route Handlers for mutations? | Developer experience, caching semantics | Server Actions (simpler; no separate fetch in components) |
| W-2 | SWR vs. React Query vs. custom hooks for client data? | Bundle size, cache control | SWR (lighter; `useSWR` pattern consistent with Next.js docs) |
| W-3 | i18n library: `next-intl` vs. plain `copy.ts` module? | Multi-language future readiness | Plain `copy.ts` for MVP; migrate to `next-intl` before internationalisation sprint |
| W-4 | Admin route group protection: middleware or `requireRole()` in layout? | Edge vs. Node runtime | `requireRole()` in layout (simpler; avoids middleware cookie parsing complexity) |
| W-5 | File upload: direct S3 PUT from browser vs. relay through API? | CORS config on storage bucket | Direct PUT via presigned URL (performance; no API bandwidth cost) |

---

## 7. Dependency map (phases)

```
W0 (foundation) ──┬──► W1 (auth)
                  │         │
                  │         ├──► W2 (seller wizard)
                  │         │         │
                  │         │         └──► W3 (admin ops) ──► W4 (buyer) ──► W5 (viewings)
                  │         │                                                      │
                  └─────────┴──────────────────────────────────────────────► W6 (quality)
                                                                                   │
                                                                              W7 (production)
```

Backend phase gates:
- W1 requires API Phase 2 (identity)
- W2 requires API Phase 3 (seller listings)
- W3 requires API Phase 4 (admin ops)
- W4 requires API Phase 5 (buyer marketplace)
- W5 requires API Phase 6 (viewings + notifications)

UI scaffold and static versions can be built ahead of any backend phase. All wiring work (Server Actions, real data) should wait until the corresponding backend phase passes its own definition-of-done.
