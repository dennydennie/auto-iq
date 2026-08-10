import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const script = await readFile(
  new URL("./railway-web.sh", import.meta.url),
  "utf8",
);

test("web variables and deploys use the resolved Railway project", () => {
  assert.match(script, /railway variable set "\$value" \\\n\s+--project "\$project_id"/);
  assert.match(script, /configure_storage_variables "\$project_id"/);
  assert.match(script, /configure_observability_variables "\$project_id"/);
  assert.match(script, /deploy_bundle "\$project_id"/);
});
