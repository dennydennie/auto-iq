# Architecture Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate the 2026-07-09 architecture audit on `feature/login-otp-account-channels`, prioritizing broken user flows and authentication security before completing orphaned workflows and hardening.

**Architecture:** Preserve the NestJS API, Next.js App Router BFF, Flutter client, and shared-contract boundaries. Restore missing BFF routes using `apps/web/lib/remote-api.ts`, keep all browser mutations server-side, make authentication changes in service/controller layers with focused Jest coverage, and expose existing API capabilities through small server pages plus focused client action components.

**Tech Stack:** NestJS 11, Next.js 16 App Router, React 19, Flutter, Redis, PostgreSQL/TypeORM, Jest, TypeScript, pnpm/Turbo.

## Global Constraints

- Work only on `feature/login-otp-account-channels`; preserve unrelated local files and changes.
- Keep session tokens in the HttpOnly `auto_iq_session` cookie and retain deny-by-default API guards.
- Use contracts from `packages/contracts/src` for web/API DTO shapes and enum values.
- Add focused automated tests or static checks for every regression fix.
- Do not commit secrets, generated output, local artifacts, or unrelated audit drafts.
- Run API tests/typecheck/build and web typecheck/build/readiness checks before commit.

---

### Task 1: Establish regression checks and restore P0 BFF routes

**Files:**

- Modify: `scripts/check-web-production-readiness.mjs`
- Create: `apps/web/app/api/auth/{login,register,logout,forgot-password,reset-password}/route.ts`
- Create: `apps/web/app/api/auth/otp/{send,verify}/route.ts`
- Create: `apps/web/app/api/me/saved-vehicles/[listingId]/route.ts`
- Create: `apps/web/app/api/seller/storage/images/presign/route.ts`
- Create: `apps/web/app/admin/login/page.tsx`

- [ ] Add required-route assertions to the readiness check and run it to observe missing-file failures.
- [ ] Restore the nine proxies from the established remote API patterns; login stores and logout always clears the browser cookie.
- [ ] Restore the admin login page with `AuthShell` and `<LoginForm mode="admin" />`.
- [ ] Re-run readiness, web typecheck, and web build.

### Task 2: Close OTP enumeration and brute-force paths

**Files:**

- Modify: `apps/api/src/modules/identity/otp.service.spec.ts`
- Modify: `apps/api/src/modules/identity/otp.service.ts`
- Modify: `apps/api/src/modules/identity/auth.service.spec.ts`
- Modify: `apps/api/src/modules/identity/auth.service.ts`
- Modify: `apps/api/src/modules/identity/auth.controller.ts`
- Modify: `apps/api/src/modules/identity/auth.controller.spec.ts` or add focused controller coverage
- Modify: `apps/web/components/auth/login-form.tsx`
- Modify: `apps/web/components/auth/otp-form.tsx`
- Modify: `apps/web/app/auth/otp/page.tsx`
- Modify: `apps/mobile/lib/src/screens/auth/otp_verification_screen.dart`
- Modify: shared identity contracts as required by the verified response.

- [ ] Write failing tests for unknown-account generic errors, five-attempt invalidation, cleanup on success, masked phone details, IP-composite throttling, and session creation after OTP verification.
- [ ] Run each focused Jest test and confirm it fails for the expected missing behavior.
- [ ] Add Redis attempt tracking with the code TTL, generic invalid responses, masked destinations, composite login throttles, and session-on-verify.
- [ ] Remove phone query-string propagation; make web/mobile force resend after `OTP_MAX_ATTEMPTS`.
- [ ] Run focused tests, API typecheck, contracts typecheck, web typecheck, and Flutter analyze/test if configured.

### Task 3: Restore SEO and gated-route behavior

**Files:**

- Create: `apps/web/app/robots.ts`
- Create: `apps/web/app/sitemap.ts`
- Create: `apps/web/middleware.ts` or the Next.js 16 equivalent `apps/web/proxy.ts`
- Modify: `scripts/check-web-production-readiness.mjs`

- [ ] Add static assertions for metadata routes, crawl exclusions, and authenticated route matching.
- [ ] Implement static sitemap entries plus published catalogue URLs with graceful upstream failure handling.
- [ ] Redirect gated pages when the session cookie is absent while excluding `/admin/login`.
- [ ] Run readiness, typecheck, and build.

### Task 4: Expose admin quote and vehicle-request workflows

**Files:**

- Modify: `packages/contracts/src/quotes.ts`
- Create: admin quote list/update BFF routes and page/action components.
- Create: buyer vehicle-request create/list routes and UI.
- Replace: `apps/web/app/admin/requests/page.tsx`
- Create: admin vehicle-request list/update BFF routes and action components.
- Modify: `apps/web/app/admin/layout.tsx`

- [ ] Add contract/static checks for `updatedAt` quote sorting and all required BFF route files.
- [ ] Implement paginated admin quote review with accessible status controls and CSRF-protected PATCH forwarding.
- [ ] Implement buyer create/list UI using enum-constrained fields and cents-safe budget conversion.
- [ ] Implement admin request queue/update actions and promote both workflows in navigation.
- [ ] Run contracts typecheck, readiness, web typecheck, and build.

### Task 5: Expose seller viewings, listing lifecycle, and notification retry

**Files:**

- Create: seller viewings BFF route/page/action component.
- Modify: `apps/api/src/modules/viewings/viewings.service.ts` and focused specs for semantic method naming where internal callers permit.
- Modify: `apps/web/app/api/admin/listings/[listingId]/[action]/route.ts`
- Modify: `apps/web/components/admin/admin-listing-actions.tsx`
- Create: `apps/web/app/admin/notifications/page.tsx`
- Create: admin notification retry BFF route/action component.
- Modify: `apps/web/app/admin/layout.tsx`

- [ ] Add failing/static checks for the new routes and post-publish action whitelist.
- [ ] Add seller listing-viewing list and acknowledgement action.
- [ ] Enable delist, reserve, and sold actions only from valid listing states.
- [ ] Add failed/dead-letter notification filtering and retry; promote notifications in navigation.
- [ ] Run focused API tests, readiness, web typecheck, and build.

### Task 6: Complete remaining reachable workflows and user-facing polish

**Files:**

- Rebuild: `apps/web/app/onboarding/consents/page.tsx` and focused form/BFF route.
- Modify: seller listing detail to render timeline.
- Modify: `apps/web/components/marketplace/filter-sidebar.tsx` and catalogue page for dependent model facets.
- Modify: `apps/web/components/marketplace/vehicle-interest-panel.tsx`.

- [ ] Wire consent persistence for all required versions/types.
- [ ] Surface listing history and dependent models using existing API routes.
- [ ] Replace implementation copy and raw IDs/states with user-facing confirmations.
- [ ] Default viewing requests to two business days ahead.
- [ ] Run readiness, typecheck, and build.

### Task 7: Reconcile contracts and harden infrastructure boundaries

**Files:**

- Modify: contract DTOs/routes where the runtime DTO is authoritative.
- Add: contract-to-OpenAPI drift check and CI command.
- Modify: CSRF handling only with a session-bound cache and retry-on-403 behavior.
- Modify: API/web admin role constants to use one shared allowed-role definition.

- [ ] Add failing drift/security checks before implementation.
- [ ] Align quote/request/inspection shapes without deleting implemented server routes.
- [ ] Cache CSRF per session without weakening mobile/API guard enforcement.
- [ ] Align admin role routing and `AdminOpsGuard` from shared contracts.
- [ ] Run contract tests, API guard tests, typechecks, readiness, and builds.

### Task 8: Repository hygiene and final verification

**Files:**

- Modify: `.gitignore`
- Remove from tracking: committed `apps/web/*.tsbuildinfo` and tracked `.DS_Store` files only.
- Consolidate marketplace route-group shells only if route moves can be completed with guards, links, and builds together.

- [ ] Add ignore patterns and remove only tracked generated/OS files.
- [ ] Run `git diff --check` and inspect every changed file.
- [ ] Run `pnpm --filter api test`, API/contracts/web typechecks, API/web builds, web readiness, and available Flutter checks.
- [ ] Stage only reviewed task files, commit with a clear message, and push `feature/login-otp-account-channels`.
