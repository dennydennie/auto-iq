import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptUrl = new URL("./railway-web.sh", import.meta.url);
const scriptPath = fileURLToPath(scriptUrl);
const script = await readFile(scriptUrl, "utf8");

test("web variables and deploys use the resolved Railway project", () => {
  assert.match(script, /railway variable set "\$value" \\\n\s+--project "\$project_id"/);
  assert.match(script, /configure_storage_variables "\$project_id"/);
  assert.match(script, /configure_observability_variables "\$project_id"/);
  assert.match(script, /deploy_bundle "\$project_id"/);
});

test("CLI deploys use the committed source SHA as the Sentry release", () => {
  assert.match(script, /git -C "\$ROOT_DIR" rev-parse --verify HEAD/);
  assert.match(
    script,
    /configure_observability_variables "\$project_id" "\$sentry_release"/,
  );
  assert.doesNotMatch(script, /SENTRY_RELEASE=\\\$\{\{RAILWAY_GIT_COMMIT_SHA\}\}/);
});

test("the Sentry release resolver is a callable shell function", () => {
  const result = spawnSync(
    "bash",
    ["-c", 'source "$1"; type -t resolve_sentry_release', "bash", scriptPath],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "function");
});
