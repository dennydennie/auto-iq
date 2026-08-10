import assert from "node:assert/strict";
import test from "node:test";
import {
  adminApprovalReady,
  adminReviewChecklist,
  approvalBlockers,
  canApproveStatus,
} from "./admin-listing-workflow.ts";

function listing(overrides = {}) {
  return {
    status: "SUBMITTED",
    sellerDisclosure: "Full service history with no known mechanical issues.",
    images: [
      { id: "1", isCover: true },
      { id: "2", isCover: false },
      { id: "3", isCover: false },
    ],
    documents: [
      { documentType: "REGISTRATION_BOOK" },
      { documentType: "SELLER_ID" },
      { documentType: "PURCHASE_IMPORT_DOCS" },
    ],
    ownershipVerification: { status: "APPROVED" },
    inspectionReport: { buyerSummaryApproved: true },
    ...overrides,
  };
}

test("approval is available only from active review statuses", () => {
  assert.equal(canApproveStatus("SUBMITTED"), true);
  assert.equal(canApproveStatus("INSPECTION_PENDING"), true);
  assert.equal(canApproveStatus("APPROVED"), false);
  assert.equal(canApproveStatus("PUBLISHED"), false);
});

test("approval requires ownership and buyer-summary gates", () => {
  assert.equal(adminApprovalReady(listing()), true);
  assert.equal(
    adminApprovalReady(
      listing({ ownershipVerification: { status: "IN_REVIEW" } }),
    ),
    false,
  );
  assert.equal(
    adminApprovalReady(
      listing({ inspectionReport: { buyerSummaryApproved: false } }),
    ),
    false,
  );
  assert.equal(
    adminApprovalReady(
      listing({ documents: [{ documentType: "REGISTRATION_BOOK" }] }),
    ),
    false,
  );
});

test("the checklist covers seller assets and trust gates", () => {
  assert.deepEqual(
    adminReviewChecklist(listing()).map((item) => [item.id, item.complete]),
    [
      ["disclosure", true],
      ["photos", true],
      ["documents", true],
      ["ownership", true],
      ["inspection", true],
      ["summary", true],
    ],
  );
});

test("blockers identify missing mandatory documents and approvals", () => {
  const blockers = approvalBlockers(
    listing({
      documents: [{ documentType: "REGISTRATION_BOOK" }],
      ownershipVerification: { status: "IN_REVIEW" },
    }),
  );

  assert.deepEqual(blockers, [
    "Mandatory ownership documents uploaded",
    "Ownership verification approved",
  ]);
});
