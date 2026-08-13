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
const catalogueQuery = read(
  "apps/api/src/modules/listings/catalogue-query.service.ts",
);
const publicMapper = read(
  "apps/api/src/modules/listings/public-listing.mapper.ts",
);
const quotesService = read("apps/api/src/modules/quotes/quotes.service.ts");
const requestsService = read(
  "apps/api/src/modules/vehicle-requests/vehicle-requests.service.ts",
);
const cataloguePage = read(
  "apps/web/app/(marketplace)/vehicles/page.tsx",
);
const detailPage = read(
  "apps/web/app/(marketplace)/vehicles/[id]/page.tsx",
);
const savedProxy = read(
  "apps/web/app/api/me/saved-vehicles/[listingId]/route.ts",
);
const quoteProxy = read(
  "apps/web/app/api/buyer/quotes/[listingId]/route.ts",
);
const requestProxy = read("apps/web/app/api/vehicle-requests/route.ts");
const modelFields = read(
  "apps/web/components/marketplace/make-model-fields.tsx",
);
const modelFacetsProxy = read(
  "apps/web/app/api/catalogue/model-facets/route.ts",
);
const mileageFields = read(
  "apps/web/components/marketplace/mileage-range-fields.tsx",
);
const mileageOptions = read("apps/web/lib/catalogue-mileage.ts");
const priceFields = read(
  "apps/web/components/marketplace/price-range-fields.tsx",
);
const priceOptions = read("apps/web/lib/catalogue-price.ts");
const yearFields = read(
  "apps/web/components/marketplace/year-range-fields.tsx",
);
const yearOptions = read("apps/web/lib/catalogue-year.ts");
const browserTest = read("apps/web/e2e/buyer-marketplace.spec.ts");

for (const route of [
  "savedVehicles",
  "savedVehicle",
  "buyerList",
  "vehicleRequests",
]) {
  requireText(routes, route, `Buyer marketplace route ${route} is required.`);
}

requireText(
  catalogueQuery,
  ".where(\"vehicle.status = 'PUBLISHED'\")",
  "Catalogue queries must remain published-only.",
);
requireText(
  publicMapper,
  "toInspectionSummaryDto",
  "Public detail must use the buyer-safe inspection mapper.",
);
requireText(
  quotesService,
  "quote:${userId}",
  "Quote creation must remain rate limited by buyer.",
);
requireText(
  requestsService,
  "vehicle-request:${userId}",
  "Sourcing requests must remain rate limited by buyer.",
);
requireText(
  cataloguePage,
  'roles.includes("BUYER")',
  "Save and contact controls must be scoped to buyer accounts.",
);
requireText(
  detailPage,
  'currentViewer === "buyer"',
  "Vehicle detail actions must be scoped to buyer accounts.",
);

for (const proxy of [savedProxy, quoteProxy, requestProxy]) {
  requireText(proxy, "issueRemoteCsrfToken", "Buyer mutations must forward CSRF.");
  requireText(proxy, "readSessionCookie", "Buyer mutations must forward the HttpOnly session.");
}

for (const evidence of [
  "setModel(\"\")",
  "loadModels(nextMake)",
  "AbortController",
  "Loading available models",
  "Retry models",
]) {
  requireText(modelFields, evidence, `Reactive model filter must include ${evidence}.`);
}
requireText(
  modelFacetsProxy,
  "ROUTES.catalogue.modelFacets",
  "The web model-facet proxy must use the shared catalogue route.",
);
requireText(
  modelFacetsProxy,
  "proxyRemoteResponse",
  "The web model-facet proxy must preserve API response handling.",
);

for (const evidence of ['name: "mileageMin"', 'name: "mileageMax"']) {
  requireText(
    mileageFields,
    evidence,
    `Mileage range control must include ${evidence}.`,
  );
}
for (const value of [
  "20_000",
  "40_000",
  "80_000",
  "100_000",
  "150_000",
  "200_000",
  "250_000",
  "300_000",
]) {
  requireText(mileageOptions, value, `Mileage options must include ${value}.`);
}
requireText(
  catalogueQuery,
  "specs.mileage_km >= :mileageMin",
  "Catalogue queries must apply the minimum mileage filter.",
);

for (const evidence of ['name: "priceMin"', 'name: "priceMax"']) {
  requireText(
    priceFields,
    evidence,
    `Price range control must include ${evidence}.`,
  );
}
for (const value of [
  "2_000",
  "3_000",
  "5_000",
  "6_000",
  "7_000",
  "8_000",
  "9_000",
  "10_000",
  "15_000",
  "20_000",
  "25_000",
  "30_000",
  "35_000",
  "40_000",
  "45_000",
  "50_000",
  "60_000",
  "70_000",
  "80_000",
  "90_000",
  "100_000",
]) {
  requireText(priceOptions, value, `Price options must include ${value}.`);
}
requireText(
  catalogueQuery,
  "pricing.ask_price_usd >= :priceMin",
  "Catalogue queries must apply the minimum price filter.",
);

for (const evidence of ['name: "yearMin"', 'name: "yearMax"']) {
  requireText(
    yearFields,
    evidence,
    `Year range control must include ${evidence}.`,
  );
}
for (const evidence of [
  "CATALOGUE_YEAR_MAX = 2026",
  "CATALOGUE_YEAR_MIN = 1990",
  "CATALOGUE_YEAR_MAX - index",
]) {
  requireText(yearOptions, evidence, `Year options must include ${evidence}.`);
}
requireText(
  catalogueQuery,
  "specs.year >= :yearMin",
  "Catalogue queries must apply the minimum year filter.",
);

for (const evidence of [
  "Apply filters",
  "Remove from saved",
  "Send quote",
  "Quote updated",
  "Request this vehicle",
  "Request updated",
]) {
  requireText(browserTest, evidence, `Browser regression must cover ${evidence}.`);
}

console.log("Buyer marketplace contract checks passed.");
