import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredFiles = [
  "apps/web/app/buy-a-car/page.tsx",
  "apps/web/app/sell-my-car/page.tsx",
  "apps/web/app/sitemap.ts",
  "apps/web/app/robots.ts",
  "apps/web/components/marketplace/vehicle-detail-specs.tsx",
  "apps/web/components/marketplace/vehicle-photo-browser.tsx",
  "apps/web/components/ui/modal-dialog.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `${file} is required for SEO and vehicle detail pages.`);
}

assert(
  !existsSync(join(root, "apps/web/app/(admin)/page.legacy.tsx")),
  "apps/web/app/(admin)/page.legacy.tsx is dead legacy code and must stay excluded.",
);

const home = read("apps/web/app/page.tsx");
assert(home.includes("SiteNavigationElement"), "Homepage must expose sitelink JSON-LD.");
assert(home.includes("Buy a car"), "Homepage must expose exact Buy a car text.");
assert(home.includes("Sell my car"), "Homepage must expose exact Sell my car text.");

const sitemap = read("apps/web/app/sitemap.ts");
assert(sitemap.includes("/buy-a-car"), "Sitemap must include /buy-a-car.");
assert(sitemap.includes("/sell-my-car"), "Sitemap must include /sell-my-car.");

const robots = read("apps/web/app/robots.ts");
assert(robots.includes("sitemap"), "Robots route must expose sitemap location.");

const webSmoke = read("scripts/smoke-web-routes.mjs");
for (const route of ["/", "/vehicles", "/buy-a-car", "/sell-my-car", "/admin/login", "/robots.txt", "/sitemap.xml", "/favicon.ico"]) {
  assert(webSmoke.includes(`"${route}"`), `Web smoke must check ${route}.`);
}

const remoteSmoke = read("scripts/smoke-remote.sh");
assert(remoteSmoke.includes("Array.isArray(data.data)"), "Remote smoke must accept catalogue responses with a data array.");
assert(!remoteSmoke.includes("meta.hasMore"), "Remote smoke must not use meta.hasMore as catalogue success.");

const marketplaceLayout = read("apps/web/app/(marketplace)/layout.tsx");
assert(marketplaceLayout.includes("Buy a car"), "Marketplace nav must expose Buy a car.");
assert(marketplaceLayout.includes("Sell my car"), "Marketplace nav must expose Sell my car.");

const detailPage = read("apps/web/app/(marketplace)/vehicles/[id]/page.tsx");
assert(detailPage.includes("VehiclePhotoBrowser"), "Vehicle detail must use photo browser.");
assert(detailPage.includes("VehicleDetailSpecs"), "Vehicle detail must render grouped specs.");
assert(detailPage.includes("Request viewing or quote"), "Vehicle detail must expose action CTA.");

const specs = read("apps/web/components/marketplace/vehicle-detail-specs.tsx");
assert(specs.includes("Vehicle details"), "Specs component must group vehicle details.");
assert(specs.includes("Vehicle performance"), "Specs component must group performance fields.");
assert(specs.includes("Market details"), "Specs component must group market details.");
assert(specs.includes("Not provided"), "Specs component must avoid fake values for missing data.");

const interestPanel = read("apps/web/components/marketplace/vehicle-interest-panel.tsx");
assert(interestPanel.includes("ModalDialog"), "Buyer quote/viewing actions must open in modals.");
assert(interestPanel.includes('setOpenModal("quote")'), "Quote action must open the quote modal.");
assert(interestPanel.includes('setOpenModal("viewing")'), "Viewing action must open the viewing modal.");

const quotesPage = read("apps/web/app/quotes/page.tsx");
assert(quotesPage.includes("SiteHeader"), "Quotes page must include the workspace menu.");
assert(quotesPage.includes("Sell my car"), "Quotes page menu must include Sell my car.");

const confirmDialog = read("apps/web/components/ui/confirm-dialog.tsx");
assert(confirmDialog.includes("left-1/2 top-1/2"), "Confirm dialog must be centered in the viewport.");

const submitAction = read("apps/web/components/seller/submit-listing-action.tsx");
assert(submitAction.includes("Submission checklist"), "Seller submit action must show missing review requirements.");
assert(submitAction.includes("submitErrorMessage"), "Seller submit action must surface API validation details.");

console.log("SEO and vehicle detail checks passed.");
