import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const moduleUrl = pathToFileURL(
  fileURLToPath(new URL("../next.config.ts", import.meta.url)),
).href;

function loadNextConfig(env) {
  const script = `
    import config from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(config.images.remotePatterns));
  `;
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    { env: { ...process.env, ...env }, encoding: "utf8" },
  );
}

test("pins private Railway image URLs to the storage endpoint in production", () => {
  const result = loadNextConfig({
    NODE_ENV: "production",
    STORAGE_ENDPOINT: "https://storage.railway.app",
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    SENTRY_ENVIRONMENT: "production",
    SENTRY_RELEASE: "web@1.0.0",
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const patterns = JSON.parse(result.stdout);
  assert.ok(patterns.some((pattern) => pattern.hostname === "**.storage.railway.app"));
  assert.ok(patterns.some((pattern) => pattern.hostname === "storage.railway.app"));
  assert.doesNotMatch(result.stdout, /STORAGE_PUBLIC_BASE_URL is required/);
});

test("rejects a localhost storage endpoint in production", () => {
  const result = loadNextConfig({
    NODE_ENV: "production",
    STORAGE_ENDPOINT: "http://localhost:9000",
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    SENTRY_ENVIRONMENT: "production",
    SENTRY_RELEASE: "web@1.0.0",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /STORAGE_ENDPOINT/i);
});
