import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`${relativePath} is required by the web width system.`);
  }
  return readFileSync(absolutePath, "utf8");
}

function collectSourceFiles(relativeDirectory) {
  const pending = [relativeDirectory];
  const files = [];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of readdirSync(join(root, directory), {
      withFileTypes: true,
    })) {
      const relativePath = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(relativePath);
      if (entry.isFile() && relativePath.endsWith(".tsx"))
        files.push(relativePath);
    }
  }
  return files;
}

function requireFragments(relativePath, fragments) {
  const source = read(relativePath);
  const missing = fragments.filter((fragment) => !source.includes(fragment));
  if (missing.length === 0) return;
  throw new Error(`${relativePath} is missing: ${missing.join(", ")}`);
}

const contentPages = [
  "apps/web/app/(marketplace)/account/page.tsx",
  "apps/web/app/(marketplace)/quotes/page.tsx",
  "apps/web/app/(marketplace)/viewings/page.tsx",
  "apps/web/app/inspector/tasks/[id]/page.tsx",
  "apps/web/app/seller/listings/[id]/edit/page.tsx",
  "apps/web/app/seller/listings/new/page.tsx",
  "apps/web/app/seller/viewings/page.tsx",
];

const widePages = [
  "apps/web/app/(marketplace)/requests/page.tsx",
  "apps/web/app/(marketplace)/saved/page.tsx",
  "apps/web/app/(marketplace)/vehicles/[id]/page.tsx",
  "apps/web/app/admin/inspections/[id]/page.tsx",
  "apps/web/app/admin/inspections/page.tsx",
  "apps/web/app/admin/listings/[id]/page.tsx",
  "apps/web/app/admin/listings/page.tsx",
  "apps/web/app/admin/notifications/page.tsx",
  "apps/web/app/admin/page.tsx",
  "apps/web/app/admin/quotes/page.tsx",
  "apps/web/app/admin/reports/page.tsx",
  "apps/web/app/admin/requests/page.tsx",
  "apps/web/app/admin/settings/page.tsx",
  "apps/web/app/admin/users/page.tsx",
  "apps/web/app/admin/viewings/[id]/page.tsx",
  "apps/web/app/admin/viewings/page.tsx",
  "apps/web/app/inspector/tasks/page.tsx",
  "apps/web/app/seller/listings/[id]/page.tsx",
  "apps/web/app/seller/listings/page.tsx",
  "apps/web/app/seller/page.tsx",
  "apps/web/components/seller/seller-dashboard.tsx",
  "apps/web/components/skeletons/index.tsx",
];

for (const relativePath of contentPages) {
  requireFragments(relativePath, ['<WorkspacePage size="content"']);
}

for (const relativePath of widePages) {
  requireFragments(relativePath, ["<WorkspacePage"]);
}

requireFragments("apps/web/components/shared/workspace-page.tsx", [
  'as="main"',
  'size = "wide"',
  '"pb-20 pt-6"',
]);
requireFragments("apps/web/app/error.tsx", ['size="narrow"']);
requireFragments("apps/web/app/not-found.tsx", ['size="narrow"']);
requireFragments("apps/web/app/(marketplace)/vehicles/page.tsx", [
  'PageContainer as="main"',
]);
requireFragments("apps/web/app/admin/layout.tsx", [
  "max-w-[calc(var(--container-wide)+20rem)]",
]);

const scannedFiles = [
  ...collectSourceFiles("apps/web/app"),
  ...collectSourceFiles("apps/web/components"),
];
const legacyMainWidth = /<main[^>]*\bmax-w-[^\s"'<>]+[^>]*>/s;
const violations = scannedFiles.filter((relativePath) =>
  legacyMainWidth.test(read(relativePath)),
);

if (violations.length > 0) {
  throw new Error(`Legacy page widths found in: ${violations.join(", ")}`);
}

console.log("web-page-width-check: ok");
