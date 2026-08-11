import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredFiles = [
  "apps/api/src/db/entity/reference-option.entity.ts",
  "apps/api/src/db/migrations/1761100000000-CreateReferenceCatalogue.ts",
  "apps/api/src/modules/reference-data/reference-data.service.ts",
  "apps/web/components/admin/reference-option-manager.tsx",
];

const failures = requiredFiles.filter((file) => !existsSync(join(root, file)));
const enums = readFileSync(join(root, "packages/contracts/src/enums.ts"), "utf8");
for (const name of ["BODY_TYPES", "FUEL_TYPES", "TRANSMISSION_TYPES", "DRIVE_TYPES", "CONDITION_GRADES"]) {
  if (enums.includes(`export const ${name}`)) failures.push(`static ${name} remains in contracts`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("reference-catalogue-check: ok");
