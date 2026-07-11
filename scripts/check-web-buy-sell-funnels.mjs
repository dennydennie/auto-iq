import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    throw new Error(`${path} is required for the buy and sell funnels.`);
  }
  return readFileSync(absolutePath, "utf8");
}

function assertIncludes(source, expected, message) {
  if (!source.includes(expected)) {
    throw new Error(message);
  }
}

const buyPage = read("apps/web/app/buy-a-car/page.tsx");
const buyFunnel = read("apps/web/components/marketing/buy-car-funnel.tsx");

assertIncludes(
  buyPage,
  "BuyCarFunnel",
  "Buy page must compose the discovery funnel.",
);
assertIncludes(
  buyPage,
  "limit: 4",
  "Buy page must request only four preview listings.",
);
assertIncludes(
  buyPage,
  'sortBy: "publishedAt"',
  "Buy previews must show newest inventory.",
);
assertIncludes(
  buyPage,
  "isServerApiFailure",
  "Buy page must handle catalogue failures safely.",
);
assertIncludes(
  buyFunnel,
  'action="/vehicles"',
  "Buy search must submit to the catalogue.",
);
assertIncludes(
  buyFunnel,
  "bodyType=SUV",
  "Buy funnel must expose body-type shortcuts.",
);
assertIncludes(
  buyFunnel,
  "verified=true",
  "Buy funnel must expose verified inventory.",
);
assertIncludes(
  buyFunnel,
  "priceMax=10000",
  "Buy funnel must expose USD budget shortcuts.",
);
assertIncludes(
  buyFunnel,
  "VehicleCard",
  "Buy previews must reuse the marketplace vehicle card.",
);
assertIncludes(
  buyFunnel,
  "No vehicles are published yet",
  "Buy funnel needs an honest empty state.",
);

const sellPage = read("apps/web/app/sell-my-car/page.tsx");
const sellFunnel = read("apps/web/components/marketing/sell-car-funnel.tsx");
const newListingPage = read("apps/web/app/seller/listings/new/page.tsx");
const createListingForm = read(
  "apps/web/components/seller/create-listing-form.tsx",
);

assertIncludes(
  sellPage,
  "SellCarFunnel",
  "Sell page must compose the conversion funnel.",
);
assertIncludes(
  sellPage,
  'variant="underline"',
  "Sell page must use the marketing header treatment.",
);
assertIncludes(
  sellFunnel,
  "Vehicle details",
  "Sell funnel must expose the vehicle stage.",
);
assertIncludes(
  sellFunnel,
  "Condition and price",
  "Sell funnel must expose the condition stage.",
);
assertIncludes(
  sellFunnel,
  "Photos and review",
  "Sell funnel must expose the review stage.",
);
assertIncludes(
  sellFunnel,
  "bodyType=SEDAN",
  "Sell funnel must support Sedan deep links.",
);
assertIncludes(
  sellFunnel,
  "bodyType=SUV",
  "Sell funnel must support SUV deep links.",
);
assertIncludes(
  sellFunnel,
  "bodyType=BAKKIE",
  "Sell funnel must support Bakkie deep links.",
);
assertIncludes(
  sellFunnel,
  "<details",
  "Sell FAQs must use native disclosure controls.",
);
assertIncludes(
  sellFunnel,
  "<summary",
  "Sell FAQs must have keyboard-accessible summaries.",
);
assertIncludes(
  sellFunnel,
  "Prepare these details",
  "Sell funnel must include a preparation checklist.",
);
assertIncludes(
  newListingPage,
  "BODY_TYPES.includes",
  "Listing entry must validate body-type deep links.",
);
assertIncludes(
  newListingPage,
  "initialBodyType",
  "Listing entry must pass the validated body type.",
);
assertIncludes(
  createListingForm,
  "createInitialForm",
  "Listing form must create isolated initial state.",
);
assertIncludes(
  createListingForm,
  "initialBodyType?: BodyType",
  "Listing form must accept a supported initial body type.",
);

console.log("Buy and sell funnel checks passed.");
