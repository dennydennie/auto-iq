import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const routeFiles = [
  "apps/web/app/(marketplace)/vehicles/page.tsx",
  "apps/web/app/(marketplace)/vehicles/[id]/page.tsx",
];

const failures = [];

for (const routeFile of routeFiles) {
  const source = readFileSync(join(root, routeFile), "utf8");

  if (!source.includes("OffsetPaginatedResponse")) {
    failures.push(`${routeFile} must import OffsetPaginatedResponse for /me/saved-vehicles.`);
  }

  if (!source.includes("extractSavedVehicles")) {
    failures.push(`${routeFile} must normalize saved vehicles through extractSavedVehicles.`);
  }

  if (source.includes("savedResult.data.map(")) {
    failures.push(`${routeFile} must not call .map() on the saved-vehicles response wrapper.`);
  }

  if (!source.includes("OffsetPaginatedResponse<SavedVehicleDto>")) {
    failures.push(`${routeFile} must type /me/saved-vehicles as an offset-paginated response.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
