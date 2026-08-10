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

const routes = read("packages/contracts/src/routes.ts");
const contracts = read("packages/contracts/src/inspections.ts");
const controller = read("apps/api/src/modules/inspections/inspections.controller.ts");
const inspectionDto = read("apps/api/src/modules/inspections/dto/inspections.dto.ts");
const adminController = read("apps/api/src/modules/admin-ops/admin-ops.controller.ts");
const service = read("apps/api/src/modules/inspections/inspections.service.ts");
const catalogue = read("apps/api/src/modules/listings/catalogue.service.ts");
const storage = read("apps/api/src/modules/storage/storage.service.ts");
const adminQueue = read("apps/web/app/admin/inspections/page.tsx");
const adminDetail = read("apps/web/app/admin/inspections/[id]/page.tsx");
const adminSummary = read("apps/web/components/admin/admin-inspection-summary-form.tsx");
const inspectorForm = read("apps/web/components/inspector/inspection-report-form.tsx");
const workflow = read("apps/web/lib/inspection-workflow.ts");
const photoProxy = read(
  "apps/web/app/api/inspector/tasks/[taskId]/photos/presign/route.ts",
);
const browserTest = read("apps/web/e2e/inspection-workflow.spec.ts");

for (const route of [
  "findingPhotoPresign",
  "inspectionTasks",
  "inspectionTask",
  "inspectors",
]) {
  requireText(routes, route, `Inspection route ${route} is required.`);
}

for (const contract of [
  "AdminInspectionTaskListParams",
  "InspectionPhotoPresignRequest",
  "InspectorOptionDto",
]) {
  requireText(contracts, contract, `Inspection contract ${contract} is required.`);
}

requireText(controller, "@UseGuards(CsrfGuard)", "Inspector mutations require CSRF.");
requireText(controller, "presignPhoto", "Inspector photo presign endpoint is required.");
requireText(inspectionDto, "ValidateNested", "Every submitted finding must receive DTO validation.");
requireText(adminController, '@Get("inspection-tasks")', "Admin inspection queue endpoint is required.");
requireText(adminController, '@Get("inspectors")', "Admin inspector options endpoint is required.");
requireText(service, "REQUIRED_REPORT_CATEGORIES", "API must require complete category coverage.");
requireText(service, "findByIdForInspector", "Inspector task access must remain assignment-scoped.");
requireText(service, "inspectPendingInspectionUpload", "Evidence uploads must be verified before persistence.");
requireText(service, 'template: "INSPECTION_ASSIGNED"', "Assignment notification is required.");
requireText(service, 'template: "INSPECTION_COMPLETE"', "Completion notification is required.");
requireText(catalogue, "findApprovedSummary", "Buyer inspection summaries must be approval-gated.");
requireText(catalogue, "buyerSummaryApproved", "Only approved summaries may reach buyers.");
requireText(storage, '"inspection-reports"', "Inspection evidence needs a private storage prefix.");
requireText(adminQueue, "ROUTES.admin.inspectionTasks", "Admin inspection queue must use its API contract.");
requireText(adminDetail, "AdminInspectionSummaryForm", "Admin inspection detail must expose summary review.");
requireText(adminSummary, "includedFindingIds", "Admin must explicitly select buyer-visible findings.");
requireText(inspectorForm, "createInspectionFindings", "Inspector capture must initialize the checklist.");
requireText(workflow, "REQUIRED_INSPECTION_CHECKLIST", "The required category checklist must be shared and tested.");
requireText(inspectorForm, "INSPECTION_FINDING_RATINGS", "Inspector capture must expose ratings.");
requireText(inspectorForm, "photos/presign", "Inspector capture must support evidence photos.");
requireText(photoProxy, "issueRemoteCsrfToken", "The photo proxy must forward CSRF securely.");

for (const action of [
  "Assign inspector",
  "Submit inspection report",
  "Approve buyer summary",
  "Awaiting admin review",
]) {
  requireText(browserTest, action, `Browser workflow must cover ${action}.`);
}

console.log("Inspection workflow contract checks passed.");
