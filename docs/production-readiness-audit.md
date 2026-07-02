# Auto IQ Web — Production Readiness Audit

Scope: `apps/web` (Next.js 16, React 19). Read-only audit against the 17-section production readiness prompt. Findings only — no code has been changed.

Codebase shape: 24 page files, 34 component files, 5,867 lines of TSX. Uses Next.js App Router with server components and server data fetching (`getSessionJson`, `getPublicJson` in `lib/server-api`). Hand-rolled UI primitives in `components/ui/`, not shadcn/ui — there is no `Dialog`, `Sheet`, `Tabs`, `DropdownMenu`, or toast primitive. Inline alerts are handled by `ErrorBanner` and `NoticeBanner`. There is also an existing `scripts/check-web-production-readiness.mjs` that blocks placeholder phrases in selected files.

---

## Section 0 — Design artifact purge

**Not applicable.** Searched for every phrase in the prompt (`Form schema`, `Audit drawer`, `Next.js handoff`, `Acceptance criteria`, `Definition of done`, `Evidence packet`, `State machine`, `Route states`, `Server/client split`, `coming soon`, `lorem ipsum`, KYB/merchant/settlement terminology) — zero matches. That section targets a fintech merchant-onboarding export; Auto IQ has no design-tool scaffolding leaking into rendered HTML.

---

## Section 1 — Artifact-dump pages

No page combines form + table + spec sections. Closest candidates inspected and cleared:

- `app/admin/listings/page.tsx` — 4 KPI cards + filter form + paginated list + pagination footer. Distinct, focused dashboard. **OK.**
- `app/admin/listings/[id]/page.tsx` — detail with sidebar of admin tools and checklist. **OK** (admin context, admin sidebar is appropriate).
- `app/seller/listings/[id]/page.tsx` — detail with sidebar of metrics and next action. **OK.**

**No findings.**

---

## Section 2 — Wizard refactor for long forms

| File | Field count | Status |
|---|---|---|
| `components/seller/create-listing-form.tsx` | 16 fields | Already a 4-step wizard with per-step validation and review step ✓ |
| `components/auth/register-form.tsx` | 7 fields (name/email/city/phone/password/confirm/consent) | **Single page — should be wizard per the rule (>6 fields).** Suggest split: Step 1 Profile (name/email/city/phone), Step 2 Password, Step 3 Review + consent. Or accept as-is given it's a stock auth signup pattern where wizards rarely improve UX. Document the deviation. |
| `components/marketplace/vehicle-interest-panel.tsx` | Quote form (3) + Viewing form (4) | **Two separate forms side-by-side, OK** as each is ≤4 fields. |
| `components/auth/login-form.tsx` (196 lines) | Identifier + password | OK. |
| `components/auth/otp-form.tsx` | 1 field | OK. |

**Findings:**
1. `register-form.tsx` — 7 fields on a single page. Either split into a 2–3 step wizard or document as an intentional deviation (signup UX trade-off).
2. `create-listing-form.tsx` uses hand-rolled `useState` + per-step manual validation rather than react-hook-form + Zod. Architecture is correct; library choice is a deviation from the prompt. Not a defect unless you want to standardize.

---

## Section 3 — Sidebar audit

Pages with a right-hand sidebar on user-facing routes:

- `app/admin/listings/[id]/page.tsx` — sidebar contains `AdminListingActions`, admin checklist, inspection state. **All admin-appropriate on an admin route.** OK.
- `app/seller/listings/[id]/page.tsx` — sidebar contains "Next action" + metric cards. **Seller-appropriate on a seller route.** OK.
- `app/(marketplace)/vehicles/[id]/page.tsx` — sidebar contains health-check score and vehicle profile. **Buyer-appropriate on a buyer route.** OK.

**No findings.** Sidebars consistently match audience.

---

## Section 4 — MVP / placeholder / mock cleanup

### Critical

1. **`app/(marketplace)/page.tsx` — entire page is hardcoded mock data and inline styles.**
   - Hardcoded `BODY_TYPES` array (line 6) including an incorrect mapping: `Vans → type: "sedan"` (line 12) — bug.
   - Hardcoded `LISTINGS` array with fake Tendai/Hilux/USD 19,500 data (line 15).
   - Hardcoded greeting "Mhoro, Tendai 👋" (line 35) — assumes a user named Tendai.
   - Search input is a fake `<span>` placeholder, not a real input (lines 51–68).
   - Body-type pills are non-functional buttons (lines 71–85).
   - Uses inline `style={{}}` throughout instead of Tailwind/shadcn primitives — out of step with the rest of the app.
   - No data fetching, no loading state, no error state, no empty state.
   - Compare with the proper buyer catalogue at `app/(marketplace)/vehicles/page.tsx` which is fully wired.
   - **Action:** delete this file or rewrite as a real home dashboard that fetches `ROUTES.catalogue.list` with featured/recent vehicles, using `VehicleCard`. Marketplace root should probably redirect to or render `/vehicles`.

2. **`app/(marketplace)/page.legacy.tsx`** — 166-line legacy file still in the route group. Even though `.legacy.tsx` isn't picked up by Next.js as a route, it pollutes the tree, is referenced by no one, and ships nothing.
   - **Action:** delete.

3. **`app/page 2.tsx`** — duplicate of `app/page.tsx` with a Finder " 2" suffix. 225 lines. Could collide with routing if renamed.
   - **Action:** delete.

4. **`app/(admin)/` route group is entirely empty** — `app/(admin)/listings/[id]/`, `app/(admin)/inspections/[id]/`, `app/(admin)/viewings/` are all empty directories with no `page.tsx`. Looks like an aborted refactor toward a `(admin)` route-grouped admin tree that was superseded by the flat `app/admin/` tree.
   - **Action:** delete the `app/(admin)/` directory entirely.

### Medium

5. **Admin stub pages (5 files).** `app/admin/users/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/requests/page.tsx`, `app/admin/inspections/page.tsx`, `app/admin/reports/page.tsx` are 15-line files that only render an `EmptyState` saying "no X". They're linked from the admin sidebar nav and create dead-link UX.
   - **Action:** either implement (`requests` and `inspections` have backing endpoints in `app/api/admin/`), gate them behind a feature flag, or remove the nav entries until they ship.

6. **No `.env.example` exists in `apps/web/`.** Web app uses `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL` (only the latter is in the root `.env.example`). New contributors won't know which to set.
   - **Action:** add `apps/web/.env.example` documenting both, or pick one.

### Clean

- No `TODO`/`FIXME`/`console.log`/`console.warn` in `apps/web/**`.
- No `alert()`/`confirm()`/`prompt()` calls.
- No empty `catch` blocks.
- No `useEffect` data fetching — `useEffect` is used only in `otp-form.tsx` (auto-resend timer) and `reset-password-form.tsx` (token state); both legitimate.

---

## Section 5 — Page declutter

Page heights surveyed against the "3 viewport heights / 2 unrelated domains / 1 primary CTA" tests:

- `app/admin/listings/[id]/page.tsx` (277 lines) — 4 main sections + sidebar; one domain (a single listing); admin actions are the primary CTA. **OK.**
- `app/(marketplace)/vehicles/[id]/page.tsx` (267 lines) — spec/disclosure/interest panel/health check. One domain. Interest panel is the primary CTA. **OK.**
- `app/page.tsx` (225 lines) — marketing landing page. Not over-long for a hero/marketing page.

**No findings.**

---

## Section 6 — Modal vs drawer vs page vs inline

No `Dialog`, `Sheet`, `Drawer`, or `Modal` primitive exists in `components/ui/`. Nothing in the app uses one. Every flow is either a page, an inline form, or an inline card. **Architecturally clean** — there are no misused modals to fix.

**Implication for Section 15:** destructive confirmations currently don't have a confirmation step (see admin actions below).

---

## Section 7 — Stat cards and global filters

KPI cards present on:

- `app/admin/page.tsx` — 3 cards (Approval queue, Viewings today, Open buyer requests) + 2 detailed breakdown cards.
- `app/admin/listings/page.tsx` — 4 queue cards.
- `app/admin/viewings/page.tsx` — 3 status cards.
- `app/seller/listings/[id]/page.tsx` — 3 metric cards (Views/Viewings/Quotes).

**Findings:**
1. **No trend/period indicator on any card.** Section 7 requires arrow + delta + time period. All current cards show a bare number.
2. **No `<Suspense>` wrapping** anywhere in the app. The admin dashboard awaits its data sequentially in the page component; users see the `loading.tsx` shell, not a per-card skeleton. The `StatCardSkeleton` component exists in `components/skeletons/index.tsx` but isn't used as a Suspense fallback.
3. **Cards aren't right-aligned monospace** for financial values; counts here are integers, so the rule's spirit is met, but USD values elsewhere (price strings) use display font, not monospace.
4. **Filters are URL-synced ✓** (`admin/listings`, `admin/viewings`, `(marketplace)/vehicles` all read from `searchParams`).
5. **No active-filter chips** — applied filters are shown only via the form's `defaultValue`. Section 7 calls for dismissible `<Badge>` chips with a "Clear all filters" affordance.
6. **No "Filters" drawer** for overflow filters. Current pages have ≤4 controls inline, so this is OK by the rule.
7. **No empty-filter-result state.** `admin/listings/page.tsx` line 188 has a generic "No listings in this slice" but no echo of the active filters or "Clear filters" action; ditto `admin/viewings/page.tsx`.

---

## Section 8 — Data tables

There are no true tables; the app uses **card lists** for `admin/listings`, `admin/viewings`, `seller/page`, and `(marketplace)/vehicles`. The prompt's tabular rules apply by analogy:

| Capability | Status |
|---|---|
| Search input | Only on `admin/listings` and `(marketplace)/vehicles`. No search on `admin/viewings` (only date+status). |
| Debounced (300ms) | N/A — all filters submit via form submit, not live input. |
| Column-level filters | N/A — list view. Status/date/body-type filters exist. |
| Active filter chips | **Missing.** |
| "Clear all filters" | **Missing.** |
| Sorting | Only `(marketplace)/vehicles` has a sort select. `admin/listings` and `admin/viewings` show implicit order. |
| Pagination | Server-side ✓. **No page size selector.** **No "Showing X–Y of Z".** Prev/Next only; no direct page input. Cursor-based on `(marketplace)/vehicles` is appropriate for an infinite-list feed. |
| Row actions | N/A — cards link to detail page. |
| Bulk actions | Not implemented. Admin listing approval would benefit from bulk approve/publish; not in scope of MVP. |
| Empty state | Present ✓ via `EmptyState`. Doesn't echo active filters (see Section 7 #7). |

**Findings:**
1. Admin listing/viewing lists need active-filter chips and "Clear all".
2. Pagination footer needs a "Showing 1–12 of 87" count and ideally a page size selector.
3. `admin/viewings` should accept a search query (buyer name, listing model).

---

## Section 9 — Skeleton loaders

Skeleton primitives exist in `components/skeletons/index.tsx`: `StatCardSkeleton`, `TableSkeleton`, `ListItemSkeleton`, `DetailPageSkeleton`, `ChartSkeleton`, `AvatarSkeleton`, `DashboardPageSkeleton`. **Good coverage.**

`loading.tsx` files present:
- `app/admin/loading.tsx` ✓
- `app/seller/loading.tsx` ✓
- `app/seller/listings/[id]/loading.tsx` ✓
- `app/(marketplace)/vehicles/loading.tsx` ✓

**Findings (missing `loading.tsx`):**
1. `app/(marketplace)/loading.tsx` — missing (becomes relevant once `(marketplace)/page.tsx` fetches data).
2. `app/(marketplace)/vehicles/[id]/loading.tsx` — missing. Detail page does multiple awaits (`getPublicJson`, `getOptionalSessionJson`, conditional `getSessionJson` for reference data); user sees a blank route during loading.
3. `app/admin/listings/loading.tsx` — covered by `app/admin/loading.tsx` cascade, but the dashboard-style skeleton doesn't visually match the listings page. A listings-specific skeleton would be more honest.
4. `app/admin/listings/[id]/loading.tsx` — same — cascades to dashboard skeleton which doesn't match the detail layout.
5. `app/admin/viewings/loading.tsx` — same.
6. **No per-card `<Suspense>` boundaries** — see Section 7 #2.

---

## Section 10 — Lazy loading

Zero `next/dynamic` usage in `app/` or `components/`. The app currently has no chart/map/rich-text/editor libraries to lazy load — `ScoreGauge` is a small inline SVG, `CarSilhouette` is an inline SVG. So `next/dynamic` is **not currently needed.**

**Findings:**
1. None blocking. If you add Recharts/Chart.js for the seller "Views" trend or admin throughput graphs, wrap them in `next/dynamic` with `ChartSkeleton` as the fallback (already defined).

---

## Section 11 — Routes and slug pages

Vehicle/listing entity route tree:

| Required route | Present? |
|---|---|
| `(marketplace)/vehicles/page.tsx` (public list) | ✓ |
| `(marketplace)/vehicles/[id]/page.tsx` (public detail) | ✓ |
| `seller/listings/page.tsx` (seller list) | Folded into `seller/page.tsx`. OK. |
| `seller/listings/[id]/page.tsx` (seller detail) | ✓ |
| `seller/listings/[id]/edit/page.tsx` (seller edit) | **Missing.** No way for a seller to edit a draft from the UI. |
| `seller/listings/new/page.tsx` (creation wizard) | ✓ |
| `admin/listings/page.tsx` (admin list) | ✓ |
| `admin/listings/[id]/page.tsx` (admin detail) | ✓ |

Other entities:

- `admin/viewings/page.tsx` exists, but **no `admin/viewings/[id]/page.tsx`** despite the empty `app/(admin)/viewings/` orphan above suggesting it was planned.
- `admin/inspections/page.tsx` is a stub. **No `admin/inspections/[id]/page.tsx`.** Empty orphan in `app/(admin)/inspections/[id]/`.
- `admin/requests/[id]` — not present; the `admin/requests` page is a stub.

**Slug page requirements check on existing detail pages:**
- Breadcrumb: present on `seller/listings/[id]` ✓; missing on `(marketplace)/vehicles/[id]` and `admin/listings/[id]` (both use a single "Back" link instead).
- Action button group in header: actions are in the sidebar `AdminListingActions` card on `admin/listings/[id]`. Pattern is OK; not strictly "header right" but functionally clear.
- Back button returns to filtered list state: admin and seller detail pages link to the unfiltered list root (no query restoration).

**Findings:**
1. **Add `app/seller/listings/[id]/edit/page.tsx`** (or an in-place edit drawer/sheet) — sellers cannot fix draft data today.
2. **Delete `app/(admin)/` orphan tree** or implement the routes you intended (`admin/viewings/[id]`, `admin/inspections/[id]`).
3. **Add `Breadcrumb`** to `(marketplace)/vehicles/[id]` and `admin/listings/[id]`.
4. **Preserve list filter state on back-navigation** from detail pages (pass `?return=` or use `router.back()`).

---

## Section 12 — Tabs

No `Tabs` primitive exists; no tab usage anywhere. Detail pages keep all data on a single scroll. Not currently breaking anything — but:

**Findings:**
1. `admin/listings/[id]` already mixes vehicle details, seller disclosure, ownership documents, inspection state, moderation actions, and admin checklist on one page. Once you add comments/activity log/audit history, this should become tabs: **Overview · Documents · Inspection · Activity**.
2. `seller/listings/[id]` is currently lean and doesn't need tabs.
3. `(marketplace)/vehicles/[id]` is lean and doesn't need tabs.

---

## Section 13 — Empty states

`EmptyState` component is well-designed and used widely. Coverage:

- `app/saved/page.tsx` ✓
- `app/admin/users|settings|requests|inspections|reports/page.tsx` ✓
- `app/admin/listings/page.tsx` ✓
- `app/admin/viewings/page.tsx` ✓
- `app/admin/listings/[id]/page.tsx` (404 case) ✓
- `app/seller/page.tsx` (no-listings case) ✓
- `app/seller/listings/[id]/page.tsx` (401/403 case) ✓
- `app/(marketplace)/vehicles/page.tsx` ✓
- `app/(marketplace)/vehicles/[id]/page.tsx` (404 case) ✓

**Findings:**
1. **Empty states don't echo the active filter** — see Section 7 #7.
2. **No "search results" variant** distinguished from "first-use" (per the prompt: zero data ≠ no search results ≠ no filter results). Today every filtered-out result shows the same generic empty message.
3. **No offline banner detection** anywhere in the app.

---

## Section 14 — Interactive states

`Button` component (`components/ui/button.tsx`) has variant + size + asChild + focus-visible ring. Disabled state covered via Tailwind. Loading state is handled per-form via swapping the label ("Saving...") and `disabled={isPending}` — that prevents double-submission ✓.

`Input` and `Textarea` components have focus ring, `aria-invalid` styling hook via prop. Most forms pass an `error` to `TextInputField` and render a red inline message.

**Findings:**
1. **No `aria-invalid` is set on auth/register-form inputs** when validation fails. `create-listing-form` passes `aria-invalid={Boolean(error)}` ✓, but other forms don't.
2. **No active/selected state on Card** components used as clickable list items in `(marketplace)/page.tsx` (the hardcoded one). Not relevant once that page is replaced.
3. **Buttons-as-Links** use `buttonVariants({…})` — but those don't get the loading state. Acceptable for navigation links.

---

## Section 15 — Notifications

No toast system installed. Inline `ErrorBanner` and `NoticeBanner` are used everywhere — correct for form-level errors, but they don't cover transient success notifications well (the banner stays until the user navigates).

**Findings:**
1. **Add Sonner or equivalent.** Background actions and successful POSTs (e.g., `AdminListingActions` approve/publish) deserve a 3-second success toast, not just a persistent inline banner.
2. **Destructive admin actions lack confirmation.** `AdminListingActions` (`reject`, `request-changes`) only requires a non-empty note before clicking; clicking immediately submits. Per Section 15: destructive confirmations need a `<Dialog>`. Today there's no `Dialog` primitive — add one and gate `reject` behind it.
3. **No undo affordance** on destructive listing actions. Out of scope for this audit if the backend doesn't support reversal.

---

## Section 16 — Navigation and layout

`app/admin/layout.tsx` is well-built: sticky sidebar with active highlight, mobile drawer, skip-to-content, focus rings, touch targets ≥44×44.

**Findings:**
1. **`app/(marketplace)/layout.tsx` is empty** — just renders children. No global nav, no logo bar, no breadcrumb. The buyer marketplace has no chrome at all.
2. **`app/seller/` has no layout file** — uses root layout. No seller-side nav or chrome.
3. **`app/auth/` has no shared layout** — pages reuse `AuthShell` component, which works but means there's no chrome continuity if a user navigates between auth pages.
4. **No breadcrumb component** in `components/shared/`. Two detail pages (`admin/listings/[id]`, `(marketplace)/vehicles/[id]`) use ad-hoc "Back to ..." links rather than a real breadcrumb trail; `seller/listings/[id]` rolls its own inline breadcrumb.
5. **Active nav item highlight** in admin layout is bold + background + indicator chip — not color-only ✓.

---

## Section 17 — Performance

| Check | Status |
|---|---|
| `next/image` with explicit width/height/alt | Used in 4 places. **All use `unoptimized`** which defeats the Next image pipeline. |
| `loading="lazy"` on below-fold images | `next/image` lazy-loads by default; not an issue. |
| No `useEffect` for data fetching | ✓ (only 2 effects in the codebase, both legitimate non-fetch). |
| Server components for data | ✓ (every page uses `async function` + `getSessionJson`/`getPublicJson`). |
| Skeleton dimensions match content | Approximate — `DashboardPageSkeleton` is a generic three-card layout that doesn't match list views exactly. |
| `loading.tsx` on every fetching route | **Missing on `(marketplace)/vehicles/[id]`** (multi-fetch detail page). See Section 9 #2. |
| Dynamic imports on heavy libs | N/A (no charts/maps yet). |

**Findings:**
1. **Remove `unoptimized` from `next/image`** in `vehicle-card.tsx`, `(marketplace)/vehicles/[id]/page.tsx`, `seller/listings/[id]/page.tsx`, `admin/listings/[id]/page.tsx` once you've confirmed the storage origin works with the Next image optimizer (your `next.config.ts` already allows `https://**`, which is permissive enough but very loose — tighten to specific S3/Tigris hosts for security).
2. **Detail-page `loading.tsx` files needed** for `(marketplace)/vehicles/[id]` and the admin slug pages (see Section 9).

---

## Punch list (prioritized for execution)

### High — blocking
1. Delete `app/(marketplace)/page.tsx` (mock home) and replace with a real fetch-backed home or redirect to `/vehicles`.
2. Delete `app/(marketplace)/page.legacy.tsx`.
3. Delete `app/page 2.tsx`.
4. Delete `app/(admin)/` empty route group.
5. Add `app/seller/listings/[id]/edit/page.tsx` so sellers can fix draft data.
6. Add confirmation `Dialog` primitive and gate `AdminListingActions` reject behind it.

### Medium — UX completeness
7. Add `loading.tsx` for `(marketplace)/vehicles/[id]`, `(marketplace)/`, `admin/listings/[id]`, `admin/viewings`, `admin/listings`.
8. Replace per-page generic empty states with filter-aware empty states ("No results for X — clear filters").
9. Add active-filter chips and "Clear all" to `admin/listings`, `admin/viewings`, `(marketplace)/vehicles`.
10. Add "Showing X–Y of Z" + optional page size to pagination footers.
11. Add a shared `Breadcrumb` component; apply to `admin/listings/[id]` and `(marketplace)/vehicles/[id]`.
12. Add `app/(marketplace)/layout.tsx` and `app/seller/layout.tsx` chrome (logo bar, account menu, mobile drawer).
13. Add Sonner toast notifications for non-blocking success/error feedback.
14. Implement or remove the 5 admin stub routes (users/settings/requests/inspections/reports).
15. Add `apps/web/.env.example`.

### Low — polish
16. Add trend/period indicators to KPI cards (or document N/A — backend may not expose period deltas yet).
17. Wrap stat cards in per-card `<Suspense>` boundaries against `StatCardSkeleton`.
18. Remove `unoptimized` from `next/image` after testing optimization against the actual storage origin; tighten `next.config.ts` remotePatterns from `**` to specific hostnames.
19. Pass `aria-invalid` on all auth form fields (register/login/forgot/reset) the way `create-listing-form` does.
20. Add `admin/viewings` search input.
21. Preserve list filter state on back-navigation from detail pages.

---

---

## Execution log (June 24, 2026)

All 21 punch-list items have been processed. Status of each below; verified with `tsc --noEmit`, `eslint .`, and `scripts/check-web-production-readiness.mjs` (all passing).

### Shipped (code changes)

| # | Item | Where |
|---|------|-------|
| 1 | Deleted mock marketplace home | `app/(marketplace)/page.tsx` removed |
| 2 | Deleted `page.legacy.tsx` | gone |
| 3 | Deleted `app/page 2.tsx` Finder duplicate | gone |
| 4 | Deleted empty `app/(admin)/` route group | gone |
| 5 | Seller listing edit route | `app/seller/listings/[id]/edit/page.tsx`, `components/seller/edit-listing-form.tsx`, PUT proxies at `app/api/seller/listings/[id]/specs/route.ts` and `pricing/route.ts`, `putJson` helper in `lib/web-api.ts`, "Edit listing" button on seller detail header |
| 6 | Confirmation dialog for destructive admin actions | `components/ui/confirm-dialog.tsx` (native `<dialog>`), gating reject in `AdminListingActions` |
| 7 | Missing `loading.tsx` | added for `(marketplace)/vehicles/[id]`, `admin/listings`, `admin/listings/[id]`, `admin/viewings`, `seller/listings/[id]/edit` |
| 8 | Filter-aware empty states | `admin/listings`, `admin/viewings`, `(marketplace)/vehicles` now switch copy + CTA when filters are active |
| 9 | Active-filter chips and clear-all | `components/shared/filter-chips.tsx`, applied to all three list pages |
| 10 | "Showing X–Y of Z" pagination | `components/shared/pagination-footer.tsx`, applied to `admin/listings` and `admin/viewings` (vehicles uses cursor pagination, so the chip + load-more pattern is retained) |
| 11 | Shared `Breadcrumb` component | `components/shared/breadcrumb.tsx`, applied to `admin/listings/[id]`, `(marketplace)/vehicles/[id]`, `seller/listings/[id]`, `seller/listings/[id]/edit` |
| 12 | Marketplace + seller layout chrome | `components/shared/site-header.tsx` with mobile drawer, used by new `app/(marketplace)/layout.tsx` and `app/seller/layout.tsx` |
| 13 | Toast notifications | `components/ui/toaster.tsx` (no external deps), `ToasterProvider` mounted in root layout, wired into `AdminListingActions`, `VehicleInterestPanel`, and `EditListingForm` |
| 14 | Stub admin routes | Pages retained as 404-prevention, but moved out of the primary admin sidebar into an "In progress" group with a "Soon" badge |
| 15 | `apps/web/.env.example` | added with `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL`, Sentry vars |
| 16 | KPI trend slot | `components/ui/stat-card.tsx` accepts `trend={ delta, period }`. All admin stat cards refactored to use it. Trend values are currently omitted because the `/admin/dashboard` endpoint does not yet return period deltas — a code comment in each consumer flags this. |
| 19 | `aria-invalid` on auth fields | added to login, register, forgot-password, reset-password, OTP forms |
| 20 | Admin viewings search input | text search field with chip support |
| 21 | Preserve list filter state on back navigation | `admin/listings` cards encode `?return=` into detail links; `admin/listings/[id]` reads it (with same-origin guard) for breadcrumb and back link. Same pattern in `(marketplace)/vehicles` via a new `returnHref` prop on `VehicleCard`. |

### Documented, not changed

| # | Item | Reason |
|---|------|--------|
| 17 | Per-card `<Suspense>` boundaries against `StatCardSkeleton` | All admin KPI counts come from a single `/admin/dashboard` payload, so per-card streaming has no real benefit without splitting that endpoint. The route-level `loading.tsx` skeleton already covers the perceived-latency case. Recommend revisiting if/when the dashboard payload is split. |
| 18 | Remove `unoptimized` from `next/image` and tighten `remotePatterns` from `https://**` | The storage origin (signed S3-style URLs from Tigris/MinIO) hasn't been verified against the Next image optimizer in this audit. A documented comment block in `next.config.ts` now describes the exact follow-up: pin to the actual `STORAGE_PUBLIC_BASE_URL` host and drop `unoptimized` after testing one optimized fetch in the target env. |

### Still genuinely deferred

- A real seller `/seller/listings` list route. Today the listings live on `/seller/page.tsx` as a section. Pull out when there are enough listings per seller to justify a dedicated list.
- Admin-side detail routes for `viewings/[id]` and `inspections/[id]`. Stub layout-only pages weren't created — the API and screens for moderating an individual viewing aren't designed yet.
- A real toast for the seller create-listing flow on success (the wizard navigates away, so the dashboard pickup is enough today; consider a follow-up toast on the dashboard read).

---

## Out of scope for this audit (would benefit from follow-up)
- `apps/api`, `apps/mobile`, `packages/` not audited.
- No automated tests written for the web app yet (`pnpm test` is a no-op in `apps/web`).
- Build/typecheck not run as part of this audit.
- No accessibility scan (axe/lighthouse) — focus was structural.
- No bundle-size analysis.
