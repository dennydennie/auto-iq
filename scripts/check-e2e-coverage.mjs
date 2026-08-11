import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const checks = {
  "apps/web/e2e/admin-review.spec.ts": ["seller sees requested changes", "foreign listing remains hidden"],
  "apps/web/e2e/admin-secondary.spec.ts": ["tenant user access", "operations report", "innovative fuel type"],
  "apps/web/e2e/buyer-marketplace.spec.ts": ["viewing lifecycle reaches seller", "notification retry"],
};
const failures = [];
for (const [file, fragments] of Object.entries(checks)) {
  const source = readFileSync(join(root, file), "utf8");
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${file}: missing ${fragment}`);
  }
}
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("e2e-coverage-check: ok");
