import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["apps/api/scripts/verify-mobile-web-e2e.mjs", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
