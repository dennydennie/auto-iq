import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`${relativePath} is required by the web UI system.`);
  }
  return readFileSync(absolutePath, "utf8");
}

function requireFragments(relativePath, fragments) {
  const source = read(relativePath);
  const missing = fragments.filter((fragment) => !source.includes(fragment));
  if (missing.length === 0) return;
  throw new Error(`${relativePath} is missing: ${missing.join(", ")}`);
}

const publicPages = [
  "apps/web/app/page.tsx",
  "apps/web/app/buy-a-car/page.tsx",
  "apps/web/app/sell-my-car/page.tsx",
  "apps/web/app/about/page.tsx",
];

for (const publicPage of publicPages) {
  requireFragments(publicPage, ["PUBLIC_SITE_LINKS", "SiteHeader"]);
}

requireFragments("apps/web/app/globals.css", [
  "--container-wide",
  "--radius-control",
  "--radius-card",
  "--section-space",
]);
requireFragments("apps/web/components/shared/site-header.tsx", [
  "PageContainer",
  "useOverlayDialog",
  'aria-modal="true"',
]);
requireFragments("apps/web/components/shared/site-footer.tsx", [
  "PageContainer",
  "Browse vehicles",
]);
requireFragments("apps/web/components/marketplace/vehicle-search-form.tsx", [
  "VehicleSearchOptions",
  'action="/vehicles"',
  "All makes",
  "All cities",
]);
requireFragments("apps/web/components/marketplace/mobile-filter-drawer.tsx", [
  "useOverlayDialog",
  'role="dialog"',
  'aria-modal="true"',
]);
requireFragments("apps/web/components/shared/auth-shell.tsx", [
  "order-1",
  "lg:order-2",
  "--container-wide",
]);

const sharedSearchConsumers = [
  "apps/web/components/marketing/home-landing.tsx",
  "apps/web/components/marketing/buy-car-funnel.tsx",
  "apps/web/app/(marketplace)/vehicles/page.tsx",
];
for (const consumer of sharedSearchConsumers) {
  requireFragments(consumer, ["VehicleSearchForm"]);
}

const footerSource = read("apps/web/components/shared/site-footer.tsx");
if (/href=["']#(?:facebook|instagram|youtube)/i.test(footerSource)) {
  throw new Error("Footer must not expose placeholder social links.");
}

console.log("web-ui-consistency-check: ok");
