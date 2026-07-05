# Logged-in workflow smoke — post-deploy

CLI smoke scripts (`scripts/smoke-remote.sh`) cannot carry a live browser
session, so authenticated flows must be verified by hand after every staging or
production deploy. Use this checklist during **Gate 4 (production smoke)** of
[`go-live-checklist.md`](./go-live-checklist.md).

Run each flow in a fresh incognito window against the target environment.

## Buyer flow (10 min)

1. Sign up as a buyer (email + Zimbabwe mobile), receive OTP, verify.
   - Confirm OTP arrives inside 30 seconds.
   - Confirm OTP field auto-fills on iOS from the SMS notification banner.
2. Browse `/vehicles`, apply Make, City, and Price filters. Confirm results
   update and active filter chips reflect the filter set.
3. Open a listing detail page.
   - Confirm the photo gallery renders, thumb strip switches images, and the
     lightbox opens with arrow-key navigation.
   - Confirm `Contact protected` banner is **hidden** for signed-in users.
4. Save the listing (heart icon). Confirm it appears in `/saved`.
5. Send a quote from the interest panel. Confirm it appears in `/quotes` with
   `Submitted` status.
6. Request a viewing. Confirm it appears in `/viewings`.
7. Sign out from the header. Confirm the header switches to the guest layout
   (`Buy a car / Sell my car / About`) and the session cookie is cleared.

## Seller flow (15 min)

1. Sign up as a seller. Complete onboarding + consents.
2. Create a new listing via the wizard. Fill Vehicle, Condition, Pricing steps.
3. Open the created listing detail page. Click **Edit listing**.
4. Upload 3 photos (Front three-quarter, Driver side, Interior).
   - Confirm the first upload is automatically marked as cover.
   - Confirm the thumbnail grid re-renders on each upload.
5. Upload 1 ownership document.
   - Confirm the review status pill reads `pending`.
6. Return to the listing detail. Verify the `Ready to submit?` checklist:
   - All 5 items ticked.
   - Submit button reads `Submit for review` and is enabled.
7. Submit for review. Confirm the confirmation dialog fires. After confirm,
   the toast reads `Submitted for review` and the listing status flips.
8. Sign out.

## Admin flow (10 min)

1. Sign in via `/admin/login` with a `SYSTEM_ADMINISTRATOR` or `ADMIN` account.
2. Confirm the admin dashboard KPIs stream in via `<Suspense>`.
3. Open the moderation queue. Filter by `Submitted`. Confirm the newly
   submitted seller listing appears.
4. Open the listing review page.
   - Confirm the admin checklist reflects the seller upload status.
   - Confirm inspection sidebar shows correct state.
5. Request changes with a moderation note. Confirm toast + status update.
6. Sign out.

## Sign-off

| Environment | Buyer flow | Seller flow | Admin flow | Verifier | Timestamp |
|---|---|---|---|---|---|
| Staging | | | | | |
| Production | | | | | |

Attach browser HAR or a screen-recording per failed step. Reference SHA and
Sentry release next to the verifier name.
