import assert from "node:assert/strict";
import test from "node:test";
import { findSourceViolations } from "./assert-committed-source.mjs";

test("rejects a modified tracked mobile file", () => {
  assert.deepEqual(findSourceViolations([" M apps/mobile/lib/main.dart"]), [
    " M apps/mobile/lib/main.dart",
  ]);
});

test("rejects a staged tracked API file", () => {
  assert.deepEqual(findSourceViolations(["M  apps/api/src/main.ts"]), [
    "M  apps/api/src/main.ts",
  ]);
});

test("rejects untracked mobile build input", () => {
  assert.deepEqual(
    findSourceViolations(["?? apps/mobile/lib/generated.dart"]),
    ["?? apps/mobile/lib/generated.dart"],
  );
});

test("ignores unrelated untracked local documentation", () => {
  assert.deepEqual(findSourceViolations(["?? docs/local-notes.md"]), []);
});
