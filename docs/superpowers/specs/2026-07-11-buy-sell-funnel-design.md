# Auto IQ Buy and Sell Funnel Design

**Date:** 2026-07-11

**Status:** Approved

## Goal

Redesign the public `/buy-a-car` and `/sell-my-car` pages as Auto IQ-branded conversion funnels inspired by the information hierarchy and interaction rhythm of WeBuyCars, while preserving Auto IQ's original identity, marketplace rules, and supported capabilities.

## Reference Findings

The reference buy experience puts inventory discovery first: category shortcuts, a prominent search control, result counts, filtering, sorting, dense vehicle cards, favourites, pricing, and finance-oriented guidance.

The reference sell experience puts conversion first: a concise promise, visible progress steps, a vehicle-category choice, a focused action panel, process guidance, trust information, supporting content, and FAQs.

Auto IQ will adopt those structural patterns without copying WeBuyCars branding, copy, imagery, icons, or unsupported promises.

## Visual Direction

- Keep the Auto IQ navy, amber, off-white, typography, hexagonal mark, and BiSell AutoIQ wordmark.
- Use a white sticky header with an amber active underline on the two marketing routes.
- Use broad, full-width content bands rather than a single floating card.
- Use dark navy action panels, amber accents, compact category tiles, and structured white cards.
- Use real Auto IQ listing imagery when available and the existing Auto IQ car silhouette fallback otherwise.
- Keep all copy original and specific to Zimbabwe, USD pricing, inspected listings, verified sellers, protected contact, and admin review.

## Buy Funnel

The `/buy-a-car` page becomes a live discovery surface rather than a static introduction.

1. A search-first hero leads with “Find your next car with the facts up front.”
2. A category rail links to the existing catalogue for All, SUV, Bakkie, Sedan, Hatch, and Verified inventory.
3. The hero search submits make and city to `/vehicles` using accessible, labelled controls.
4. Budget shortcuts route to catalogue price ranges in USD.
5. Three concise trust signals explain inspection context, seller verification, and protected contact.
6. A “Latest vehicles” section displays up to four live catalogue listings using the existing `VehicleCard` component.
7. If the catalogue API is unavailable or empty, the page shows a meaningful CTA instead of fake inventory or a blank section.
8. A short three-step buying guide explains browse, compare, and request workflows.

The page fetches only the four newest public listings. It does not load the full catalogue or introduce a new backend endpoint.

## Sell Funnel

The `/sell-my-car` page becomes a focused entry into the existing listing wizard.

1. A concise hero leads with “List your car with confidence.”
2. A visible three-stage progress rail describes Vehicle, Condition and price, and Photos and review.
3. A dark action panel shows supported Auto IQ body types and provides a dominant “Start my listing” CTA.
4. Body-type shortcuts link to `/seller/listings/new?bodyType=<TYPE>`.
5. The listing page validates the query value against `BODY_TYPES` and passes a supported value into `CreateListingForm`; invalid values fall back safely to the existing default.
6. The public page includes a three-step “How it works” section, seller benefits, a preparation checklist, and accessible FAQ accordions.
7. Copy must describe structured marketplace listing and review. It must not promise an instant valuation, guaranteed purchase, immediate payment, or unsupported vehicle categories.

## Component Boundaries

- `apps/web/components/marketing/buy-car-funnel.tsx` owns the buy hero, category rail, budget links, live preview, trust strip, and buying steps.
- `apps/web/components/marketing/sell-car-funnel.tsx` owns the sell hero, supported body-type shortcuts, process content, checklist, and FAQs.
- `apps/web/components/marketing/funnel-primitives.tsx` owns small reusable section-heading, step, and trust presentation primitives.
- Public page files own metadata, data fetching, and composition only.
- The existing `VehicleCard`, server API helpers, contracts, and listing wizard remain the sources of truth.

## Responsive and Accessibility Requirements

- Desktop layouts may use horizontal category rails and multi-column cards; mobile layouts must stack without horizontal page overflow.
- All search inputs require programmatic labels.
- Active navigation and category state may not rely on colour alone.
- Interactive targets must be at least 44 pixels high where practical.
- FAQ content uses native `details` and `summary` elements.
- Decorative icons use `aria-hidden="true"`; meaningful links retain descriptive accessible names.
- Focus-visible states must remain clearly visible against white and navy surfaces.
- Heading hierarchy must contain one `h1` per page followed by ordered `h2` section headings.

## Testing and Verification

- Add a focused static regression check for the buy and sell funnels before implementation and observe it fail.
- Verify live catalogue wiring, search parameters, supported sell body types, accessible FAQ markup, and honest marketplace copy.
- Run the focused regression check, existing SEO/detail check, saved-vehicles contract check, ESLint, TypeScript, and the production Next.js build.
- Smoke-test `/buy-a-car`, `/sell-my-car`, `/vehicles`, and a supported body-type listing entry in a browser at desktop and mobile sizes.

## Deployment

Commit and push all reviewed changes to `feature/login-otp-account-channels`. Deploy the web service to staging only, preserving the existing `/saved` regression fix. Record the Railway deployment ID, image digest, restarted service, checks run, and any verification gap. Production remains untouched.
