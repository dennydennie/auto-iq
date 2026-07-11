# Auto IQ Buy and Sell Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Auto IQ-branded, WeBuyCars-inspired public buy and sell funnels that connect directly to the existing live catalogue and seller listing wizard.

**Architecture:** Keep route files focused on metadata, server data loading, and composition. Place page-specific presentation in small marketing components, reuse the existing `VehicleCard` and server API contracts, and validate sell body-type deep links at the protected route boundary.

**Tech Stack:** Next.js 16 App Router, React 19 server/client components, TypeScript, Tailwind CSS, Lucide icons, Node static regression scripts, pnpm.

## Global Constraints

- Keep Auto IQ branding, supported workflows, Zimbabwe context, and USD pricing.
- Do not copy WeBuyCars logos, imagery, copy, icons, or unsupported service claims.
- Keep functions small and single-purpose; reuse existing catalogue, card, route, and form primitives.
- Preserve the `/saved` hotfix and existing marketplace authentication behavior.
- Add test coverage before production code and observe the focused check fail for the expected missing behavior.
- Deploy staging only from `feature/login-otp-account-channels`; production remains untouched.

---

### Task 1: Establish the buy-funnel regression contract

**Files:**
- Create: `scripts/check-web-buy-sell-funnels.mjs`
- Modify: `package.json`
- Test: `scripts/check-web-buy-sell-funnels.mjs`

**Interfaces:**
- Consumes: Node `fs` and repository-relative source files.
- Produces: `pnpm check:web-buy-sell-funnels`, a zero-dependency static regression command.

- [ ] **Step 1: Write the failing buy-funnel check**

Create a Node script with `read`, `assertIncludes`, and assertions requiring `BuyCarFunnel`, a four-listing catalogue request, `/vehicles` search action, body-type links, budget links, live `VehicleCard` reuse, and the empty-catalogue fallback.

- [ ] **Step 2: Register and run the check to verify RED**

Run: `pnpm check:web-buy-sell-funnels`

Expected: FAIL because `apps/web/components/marketing/buy-car-funnel.tsx` does not exist.

- [ ] **Step 3: Keep the failing check as the implementation contract**

Do not weaken assertions to match existing code. Confirm the failure is caused only by missing buy-funnel behavior.

### Task 2: Build the live buy discovery page

**Files:**
- Create: `apps/web/components/marketing/funnel-primitives.tsx`
- Create: `apps/web/components/marketing/buy-car-funnel.tsx`
- Modify: `apps/web/app/buy-a-car/page.tsx`
- Modify: `apps/web/components/shared/site-header.tsx`
- Test: `scripts/check-web-buy-sell-funnels.mjs`

**Interfaces:**
- Consumes: `PublicListingCardDto[]`, existing `VehicleCard`, `ROUTES.catalogue.list`, `getPublicJson`, and `withQuery`.
- Produces: `BuyCarFunnel({ listings }: { listings: PublicListingCardDto[] })` and `SiteHeader` variant `underline`.

- [ ] **Step 1: Add small shared funnel primitives**

Implement reusable section intro, trust item, and numbered step components. Each primitive accepts plain text and a Lucide icon component and remains presentational.

- [ ] **Step 2: Implement the buy funnel**

Add the search form, catalogue category links, USD budget shortcuts, three trust signals, up to four live `VehicleCard` previews, empty fallback, and three buying steps. All controls must have accessible labels and visible focus styles.

- [ ] **Step 3: Load four newest listings in the page**

Make `BuyACarPage` async, request `ROUTES.catalogue.list` with `limit: 4`, `sortBy: "publishedAt"`, and `sortDir: "DESC"`, pass an empty array on API failure, and compose the underline header with `BuyCarFunnel`.

- [ ] **Step 4: Run the focused check to verify GREEN**

Run: `pnpm check:web-buy-sell-funnels`

Expected: PASS for all buy-funnel assertions.

### Task 3: Extend the contract for the sell funnel

**Files:**
- Modify: `scripts/check-web-buy-sell-funnels.mjs`
- Test: `scripts/check-web-buy-sell-funnels.mjs`

**Interfaces:**
- Consumes: sell marketing page, protected listing page, and create-listing form source.
- Produces: regression assertions for supported category deep links and accessible conversion content.

- [ ] **Step 1: Add failing sell-funnel assertions**

Require `SellCarFunnel`, three named stages, supported body-type links, `details`/`summary` FAQs, a preparation checklist, `searchParams` validation using `BODY_TYPES.includes`, and `initialBodyType` passed to `CreateListingForm`.

- [ ] **Step 2: Run the focused check to verify RED**

Run: `pnpm check:web-buy-sell-funnels`

Expected: FAIL because `apps/web/components/marketing/sell-car-funnel.tsx` and `initialBodyType` support do not exist.

### Task 4: Build the sell conversion page and functional category links

**Files:**
- Create: `apps/web/components/marketing/sell-car-funnel.tsx`
- Modify: `apps/web/app/sell-my-car/page.tsx`
- Modify: `apps/web/app/seller/listings/new/page.tsx`
- Modify: `apps/web/components/seller/create-listing-form.tsx`
- Test: `scripts/check-web-buy-sell-funnels.mjs`

**Interfaces:**
- Consumes: `BODY_TYPES`, `BodyType`, existing protected seller route, `CreateListingForm`.
- Produces: `SellCarFunnel()` and `CreateListingForm({ initialBodyType?: BodyType })`.

- [ ] **Step 1: Implement the sell funnel**

Add the three-stage hero, supported Sedan/SUV/Bakkie/Hatch links, primary listing CTA, signup alternative, how-it-works steps, seller benefits, preparation checklist, and native FAQ accordions. Keep copy honest about listing review and protected buyer workflows.

- [ ] **Step 2: Validate the body-type query at the route boundary**

Read the first `bodyType` search parameter, accept it only when `BODY_TYPES.includes(value as BodyType)`, and pass the supported value to `CreateListingForm`.

- [ ] **Step 3: Initialise the wizard from the validated value**

Change the static initial form object into `createInitialForm(initialBodyType)` and initialise state with a lazy callback so the selected body type appears on the first listing step without creating a global mutable singleton.

- [ ] **Step 4: Run the focused check to verify GREEN**

Run: `pnpm check:web-buy-sell-funnels`

Expected: PASS for all buy and sell assertions.

### Task 5: Verify, visually inspect, and deploy staging

**Files:**
- Modify only if verification reveals a tested regression in task files.

**Interfaces:**
- Consumes: completed buy and sell funnels.
- Produces: a buildable commit, pushed branch, and verified Railway staging deployment.

- [ ] **Step 1: Run static and contract checks**

Run:

```bash
pnpm check:web-buy-sell-funnels
pnpm check:web-seo-and-vehicle-detail
pnpm check:web-saved-vehicles-contract
pnpm --filter @autoiq/web test:saved-vehicles
```

Expected: all checks pass with zero failures.

- [ ] **Step 2: Run lint, type-check, and production build**

Run:

```bash
pnpm --filter @autoiq/web lint
pnpm --filter @autoiq/web typecheck
pnpm --filter @autoiq/web build
```

Expected: all commands exit 0 without TypeScript or ESLint errors.

- [ ] **Step 3: Inspect desktop and mobile routes**

Run the built web app against the staging API and inspect `/buy-a-car`, `/sell-my-car`, `/vehicles`, and `/seller/listings/new?bodyType=SUV` at desktop and mobile widths. Confirm no horizontal overflow, one page `h1`, readable focus states, working catalogue query links, live/fallback vehicle previews, and valid seller deep-link behavior.

- [ ] **Step 4: Commit only intentional files**

Stage the two documentation files, regression script, package manifest, new marketing components, and explicitly modified route/component files. Commit with `feat(web): redesign buy and sell funnels`.

- [ ] **Step 5: Push and deploy the web staging service**

Push `feature/login-otp-account-channels`, deploy the Railway web staging service from the pushed commit, and do not restart or redeploy the API unless the web deployment configuration requires it.

- [ ] **Step 6: Run staging smoke checks**

Confirm `/buy-a-car`, `/sell-my-car`, `/vehicles`, and `/saved` return successful responses; confirm the new headings and CTAs appear; preserve the saved-vehicles regression; record deployment ID and image digest.
