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

  if (!source.includes("getOptionalSessionJson<OffsetPaginatedResponse<SavedVehicleDto>>")) {
    failures.push(`${routeFile} must request the paginated saved-vehicles response shape.`);
  }

  if (source.includes("savedResult.data.map(")) {
    failures.push(`${routeFile} must not call .map() on the saved-vehicles response wrapper.`);
  }

  if (!source.includes("savedResult.data.data")) {
    failures.push(`${routeFile} must read saved vehicles from response.data.data.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
