import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(`Account contract check failed: ${message}`);
}

const pagePath = "apps/web/app/(marketplace)/account/page.tsx";
const formPath = "apps/web/components/account/account-form.tsx";
const route = read("apps/web/app/api/me/route.ts");
const layout = read("apps/web/app/(marketplace)/layout.tsx");
const form = read(formPath);

assert(existsSync(resolve(root, pagePath)), "the /account page is missing");
assert(existsSync(resolve(root, formPath)), "the account form is missing");
assert(layout.includes('href: "/account"') && layout.includes('label: "Account"'), "navigation does not include Account");
assert(route.includes("export async function PATCH") && route.includes("issueRemoteCsrfToken"), "PATCH proxy is not CSRF protected");
assert(route.includes("ROUTES.me.profile") && route.includes("csrfToken"), "PATCH proxy does not forward the session route and CSRF token");

for (const field of [
  "fullName",
  "city",
  "vehiclePurpose",
  "searchRadiusKm",
  "deliveryPreference",
  "paymentPreference",
  "preferredMakes",
  "preferredBodyTypes",
  "preferredFuelTypes",
  "preferredTransmissions",
  "minSeats",
  "maxMileageKm",
  "yearMin",
  "yearMax",
  "budgetMin",
  "budgetMax",
  "businessName",
]) {
  assert(form.includes(field), `form field ${field} is not wired`);
}

assert(form.includes('patchJson<MeResponse>("/api/me"'), "form does not submit through the web proxy");
assert(form.includes("readOnly") && form.includes("emailVerified") && form.includes("phoneVerified"), "contact verification fields are not read-only and status-aware");
console.log("Account contract checks passed.");
