import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(
  join(root, "apps/web/components/marketing/home-landing.tsx"),
  "utf8",
);
const heroCutout = join(root, "apps/web/public/images/honda-vezel-cutout.png");
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
  "/images/honda-vezel-cutout.png",
  "object-contain",
  "lg:min-h-[calc(100svh-4.25rem)]",
];
const missing = required.filter((fragment) => !source.includes(fragment));
if (!existsSync(heroCutout))
  missing.push("apps/web/public/images/honda-vezel-cutout.png");
if (existsSync(heroCutout)) {
  const png = readFileSync(heroCutout);
  const colourType = png[25];
  if (colourType !== 4 && colourType !== 6) {
    missing.push("an alpha channel in honda-vezel-cutout.png");
  }
}
if (missing.length) {
  console.error(missing.map((fragment) => `- missing ${fragment}`).join("\n"));
  process.exit(1);
}
console.log("homepage-sections-check: ok");
