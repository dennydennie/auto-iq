import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const renderedFiles = [
  "apps/web/app/admin/page.tsx",
  "apps/web/app/admin/inspections/page.tsx",
  "apps/web/app/admin/reports/page.tsx",
  "apps/web/app/admin/requests/page.tsx",
  "apps/web/app/admin/settings/page.tsx",
  "apps/web/app/admin/users/page.tsx",
  "apps/web/app/admin/viewings/page.tsx",
  "apps/web/app/(marketplace)/vehicles/page.tsx",
  "apps/web/app/seller/page.tsx",
  "apps/web/app/seller/listings/[id]/page.tsx",
  "apps/web/app/seller/listings/new/page.tsx",
  "apps/web/components/seller/create-listing-form.tsx",
  "apps/web/components/seller/seller-dashboard.tsx",
];

const blockedPhrases = [
  "placeholder inventory",
  "placeholder counts",
  "coming soon",
  "This placeholder",
  "mock slots",
  "real database",
  "real API",
  "real admin",
  "staging API",
  "`apps/api`",
  "will appear",
];

const failures = [];

for (const file of renderedFiles) {
  const contents = readFileSync(join(ROOT, file), "utf8");

  for (const phrase of blockedPhrases) {
    if (contents.includes(phrase)) {
      failures.push(`${file}: ${phrase}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Rendered implementation artifacts found:");
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
