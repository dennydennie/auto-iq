import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const moduleUrl = pathToFileURL(
  fileURLToPath(new URL("./api-origin.ts", import.meta.url)),
).href;

function loadApiOrigin(env) {
  const script = `
    import { API_ORIGIN, API_ORIGIN_LABEL } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify({ origin: API_ORIGIN, label: API_ORIGIN_LABEL }));
  `;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    { env: { ...process.env, ...env }, encoding: "utf8" },
  );
  return result;
}

test("normalizes the API origin without duplicating /api/v1", () => {
  const result = loadApiOrigin({
    NODE_ENV: "development",
    NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1/",
    NEXT_PUBLIC_API_BASE_URL: "",
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    origin: "http://localhost:4000",
    label: "localhost:4000",
  });
});

test("uses the base-url alias when the canonical URL is empty", () => {
  const result = loadApiOrigin({
    NODE_ENV: "development",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
  });

  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).origin, "http://localhost:4000");
});

test("fails production startup when the API origin is missing", () => {
  const result = loadApiOrigin({
    NODE_ENV: "production",
    NEXT_PUBLIC_API_URL: "",
    NEXT_PUBLIC_API_BASE_URL: "",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /API origin/i);
});
