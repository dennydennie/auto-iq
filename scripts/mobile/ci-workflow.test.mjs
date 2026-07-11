import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

test("CI runs for branch names containing slashes", () => {
  assert.match(workflow, /^\s+- "\*\*"$/m);
});

test("CI analyzes, tests, and compiles the mobile app", () => {
  assert.match(workflow, /flutter analyze/);
  assert.match(workflow, /flutter test/);
  assert.match(workflow, /flutter build apk --debug/);
});
