import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const contractSource = readFileSync(
  join(ROOT, "packages/contracts/src/routes.ts"),
  "utf8",
);
const contractRoutes = extractContractRoutes(contractSource);
const controllerRoutes = process.env.OPENAPI_DOCUMENT
  ? extractOpenApiRoutes(process.env.OPENAPI_DOCUMENT)
  : extractControllerRoutes(
      sourceFiles(join(ROOT, "apps/api/src"), ".controller.ts"),
    );
const missing = [...contractRoutes].filter(
  (route) => !controllerRoutes.has(route),
);

if (missing.length > 0) {
  console.error("Contract routes without API controller mappings:");
  console.error(missing.map((route) => `- ${route}`).join("\n"));
  process.exit(1);
}

console.log(
  `Verified ${contractRoutes.size} contract routes against ${process.env.OPENAPI_DOCUMENT ? "OpenAPI" : "API controllers"}.`,
);

function extractOpenApiRoutes(documentPath) {
  const document = JSON.parse(
    readFileSync(resolve(ROOT, documentPath), "utf8"),
  );
  return new Set(Object.keys(document.paths ?? {}).map(normalizeRoute));
}

function extractContractRoutes(source) {
  const routes = new Set();
  for (const match of source.matchAll(/`\$\{BASE\}([^`]+)`/g)) {
    routes.add(normalizeRoute(`/api/v1${match[1]}`));
  }
  return routes;
}

function extractControllerRoutes(files) {
  const routes = new Set();
  for (const file of files)
    addControllerRoutes(routes, readFileSync(file, "utf8"));
  return routes;
}

function addControllerRoutes(routes, source) {
  const prefix =
    source.match(/@Controller\(\s*["']([^"']*)["']\s*\)/)?.[1] ?? "";
  const decorator =
    /@(Get|Post|Patch|Put|Delete)\(\s*(?:["']([^"']*)["'])?\s*\)/g;
  for (const match of source.matchAll(decorator)) {
    routes.add(normalizeRoute(`/api/v1/${prefix}/${match[2] ?? ""}`));
  }
}

function normalizeRoute(route) {
  return route
    .replace(/\$\{[^}]+\}/g, ":param")
    .replace(/{[^}]+}/g, ":param")
    .replace(/:[^/]+/g, ":param")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

function sourceFiles(directory, suffix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path, suffix);
    return extname(path) === ".ts" && path.endsWith(suffix) ? [path] : [];
  });
}
