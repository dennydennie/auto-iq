import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) throw new Error(`${path} is required.`);
  return readFileSync(absolutePath, "utf8");
}

function requireText(source, expected, message) {
  if (!source.includes(expected)) throw new Error(message);
}

const queue = read("apps/web/app/admin/listings/page.tsx");
const review = read("apps/web/app/admin/listings/[id]/page.tsx");
const actions = read("apps/web/components/admin/admin-listing-actions.tsx");
const verification = read(
  "apps/web/components/admin/admin-verification-actions.tsx",
);
const readiness = read("apps/web/lib/admin-listing-workflow.ts");
const proxy = read(
  "apps/web/app/api/admin/listings/[listingId]/[action]/route.ts",
);
const controller = read(
  "apps/api/src/modules/admin-ops/admin-ops.controller.ts",
);
const service = read("apps/api/src/modules/admin-ops/admin-ops.service.ts");
const browserTest = read("apps/web/e2e/admin-review.spec.ts");

for (const status of [
  "SUBMITTED",
  "OWNERSHIP_VERIFICATION_PENDING",
  "INSPECTION_PENDING",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PUBLISHED",
]) {
  requireText(queue, status, `Admin queue must expose ${status}.`);
}

requireText(queue, 'name="sort"', "Admin queue must expose date sorting.");
requireText(
  review,
  "adminReviewChecklist",
  "Admin detail must render trust gates.",
);
requireText(actions, "adminApprovalReady", "Approval must be gated in the UI.");
requireText(
  actions,
  "Publish this listing?",
  "Publishing must require confirmation.",
);
requireText(
  verification,
  'aria-label="Ownership decision"',
  "Ownership control needs an accessible label.",
);
requireText(
  readiness,
  "missingRequiredDocuments",
  "Admin readiness must check mandatory documents.",
);
requireText(
  readiness,
  "photosAreReady",
  "Admin readiness must check photos and cover.",
);
requireText(
  proxy,
  "publish: ROUTES.admin.listingPublish",
  "The BFF must whitelist publishing.",
);
requireText(
  controller,
  "@UseGuards(CsrfGuard)",
  "Unsafe admin actions must require CSRF.",
);

const publishBody = service.slice(
  service.indexOf("async publish"),
  service.indexOf("async delist"),
);
requireText(
  publishBody,
  "assertApprovalReady",
  "API publish must recheck trust gates.",
);
requireText(
  service,
  "listingWizardValidator.validateForSubmit",
  "API approval readiness must recheck seller assets.",
);
requireText(
  publishBody,
  "listingStateService.publish",
  "API publish must use the state machine.",
);

for (const action of [
  "Request changes",
  "Approve listing",
  "Publish listing",
]) {
  requireText(browserTest, action, `Browser regression must cover ${action}.`);
}

console.log("Admin review and publishing contract checks passed.");
