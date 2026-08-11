import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const checks = {
  "apps/web/app/admin/users/page.tsx": ["UserAccessAction", "Search users"],
  "apps/web/app/admin/reports/page.tsx": ["ReportDownloadButton", "Operational evidence"],
  "apps/web/app/admin/settings/page.tsx": ["ReferenceOptionManager", "ViewingLocationManager"],
  "apps/api/src/modules/admin-ops/admin-secondary.controller.ts": ["reports/operations", "reference-options", "viewing-locations"],
};

const failures = [];
for (const [file, fragments] of Object.entries(checks)) {
  if (!existsSync(join(root, file))) {
    failures.push(`${file}: missing`);
    continue;
  }
  const source = readFileSync(join(root, file), "utf8");
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${file}: missing ${fragment}`);
  }
}
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("admin-secondary-check: ok");
