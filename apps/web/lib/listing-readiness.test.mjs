import assert from "node:assert/strict";
import test from "node:test";
import {
  disclosureIsReady,
  missingRequiredDocuments,
  photosAreReady,
} from "./listing-readiness.ts";

function document(documentType) {
  return { documentType };
}

function image(id, isCover = false) {
  return { id, isCover };
}

test("requires every mandatory seller document type", () => {
  const missing = missingRequiredDocuments([
    document("REGISTRATION_BOOK"),
    document("SELLER_ID"),
  ]);

  assert.deepEqual(missing, ["PURCHASE_IMPORT_DOCS"]);
});

test("does not count optional documents as mandatory documents", () => {
  const missing = missingRequiredDocuments([
    document("INSURANCE_CERTIFICATE"),
    document("POLICE_CLEARANCE"),
  ]);

  assert.equal(missing.length, 3);
});

test("requires at least three photos including a cover", () => {
  assert.equal(photosAreReady([image("1", true), image("2")]), false);
  assert.equal(photosAreReady([image("1"), image("2"), image("3")]), false);
  assert.equal(
    photosAreReady([image("1", true), image("2"), image("3")]),
    true,
  );
});

test("trims disclosure text before checking its minimum length", () => {
  assert.equal(disclosureIsReady(" short disclosure "), false);
  assert.equal(
    disclosureIsReady(
      "  Full service history and no known mechanical issues.  ",
    ),
    true,
  );
});
