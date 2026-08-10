import assert from "node:assert/strict";
import test from "node:test";
import {
  createInspectionFindings,
  inspectionScore,
  REQUIRED_INSPECTION_CHECKLIST,
} from "./inspection-workflow.ts";

test("the inspection checklist covers every required buyer-relevant category", () => {
  assert.deepEqual(
    REQUIRED_INSPECTION_CHECKLIST.map((item) => item.category),
    ["ENGINE", "ELECTRICAL", "BODY", "TYRES", "BRAKES", "INTERIOR"],
  );
});

test("new inspection findings begin as complete pass-rated checklist rows", () => {
  const findings = createInspectionFindings();
  assert.equal(findings.length, 6);
  assert.equal(findings.every((finding) => finding.rating === "PASS"), true);
  assert.equal(inspectionScore(findings), 100);
});

test("the displayed score follows the API rating weights", () => {
  const findings = createInspectionFindings();
  findings[2].rating = "WATCH";
  assert.equal(inspectionScore(findings), 94);
  findings[4].rating = "FAIL";
  assert.equal(inspectionScore(findings), 81);
});
