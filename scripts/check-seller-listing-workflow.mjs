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

const form = read("apps/web/components/seller/create-listing-form.tsx");
const photos = read("apps/web/components/seller/photo-uploader.tsx");
const documents = read("apps/web/components/seller/document-uploader.tsx");
const submit = read("apps/web/components/seller/submit-listing-action.tsx");
const webRules = read("apps/web/lib/listing-readiness.ts");
const apiRules = read(
  "apps/api/src/modules/listings/listing-wizard.validator.ts",
);
const apiConstants = read("apps/api/src/common/constants/listing.constants.ts");
const contractEnums = read("packages/contracts/src/enums.ts");
const mobileRepository = read(
  "apps/mobile/lib/src/repositories/seller_repository.dart",
);
const mobileEditor = read(
  "apps/mobile/lib/src/screens/seller/listing_editor_screen.dart",
);

for (const title of [
  "Specs",
  "Pricing",
  "Photos",
  "Documents",
  "Review & submit",
]) {
  requireText(
    form,
    `title: "${title}"`,
    `Seller wizard must include the ${title} step.`,
  );
}

requireText(form, "persistDraft", "Wizard must save a draft before uploads.");
requireText(
  form,
  "putJson<SellerListingDto>",
  "Wizard must persist edits to an existing draft.",
);
requireText(form, "<PhotoUploader", "Wizard must include photo uploads.");
requireText(form, "<DocumentUploader", "Wizard must include document uploads.");
requireText(form, "/submit`", "Wizard must submit directly from review.");
requireText(
  form,
  "SubmitListingRequest",
  "Wizard must send the submission contract.",
);
requireText(
  photos,
  "onUploaded?.(registerResult.data)",
  "Photo uploads must update wizard state.",
);
requireText(
  documents,
  "onUploaded?.(registerResult.data)",
  "Document uploads must update wizard state.",
);
requireText(
  submit,
  "missingRequiredDocuments",
  "Detail submission must enforce mandatory documents.",
);
requireText(
  webRules,
  "photosAreReady",
  "Web readiness rules must enforce photos and cover.",
);
requireText(
  apiRules,
  "missingDocuments",
  "API submission must enforce mandatory document types.",
);
requireText(
  mobileEditor,
  "_submissionIssue",
  "Mobile submission must run the local readiness check.",
);

for (const documentType of [
  "REGISTRATION_BOOK",
  "SELLER_ID",
  "PURCHASE_IMPORT_DOCS",
]) {
  requireText(
    contractEnums,
    documentType,
    `Contracts must expose ${documentType}.`,
  );
  requireText(apiConstants, documentType, `API must require ${documentType}.`);
  requireText(
    mobileRepository,
    documentType,
    `Mobile must expose ${documentType}.`,
  );
}

console.log("Seller listing workflow contract checks passed.");
