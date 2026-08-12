import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(
  join(root, "apps/web/components/marketing/home-landing.tsx"),
  "utf8",
);
const heroPhoto = join(root, "apps/web/public/images/honda-vezel-hero.jpg");
const required = [
  "ProofGrid",
  "TrustJourney",
  "SellerCallout",
  "SiteFooter",
  'href="/sell-my-car"',
  'href="/vehicles"',
  "One protected account",
  "Confidence comes with the vehicle.",
  "List your car with confidence.",
  "/images/honda-vezel-hero.jpg",
];
const missing = required.filter((fragment) => !source.includes(fragment));
if (!existsSync(heroPhoto))
  missing.push("apps/web/public/images/honda-vezel-hero.jpg");
if (missing.length) {
  console.error(missing.map((fragment) => `- missing ${fragment}`).join("\n"));
  process.exit(1);
}
console.log("homepage-sections-check: ok");
