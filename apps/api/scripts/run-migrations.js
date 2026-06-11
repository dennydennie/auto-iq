/**
 * Project: auto-iq
 * Module: apps/api release
 * Author: backend_developer agent
 * Date: 2026-06-09
 */
"use strict";

require("reflect-metadata");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

function resolveCompiledMigrationScriptPath() {
  const candidates = [
    join(__dirname, "../dist/scripts/run-migrations.js"),
    join(__dirname, "../../dist/scripts/run-migrations.js"),
    join(__dirname, "../../../dist/scripts/run-migrations.js"),
  ];

  const compiledScriptPath = candidates.find((candidate) => existsSync(candidate));
  if (!compiledScriptPath) {
    throw new Error(
      `Compiled migration script not found. Checked: ${candidates.join(", ")}. Run pnpm --filter api build first.`,
    );
  }

  return compiledScriptPath;
}

function formatMigrationError(error) {
  if (error instanceof AggregateError) {
    return error.errors.map((item) => formatMigrationError(item)).filter(Boolean).join("; ");
  }

  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown migration failure";
}

async function runMigrationsForRelease() {
  const { runMigrationsForRelease: runCompiledMigrations } = require(resolveCompiledMigrationScriptPath());
  await runCompiledMigrations();
  process.stdout.write(
    `${JSON.stringify({
      event: "migration_release_completed",
    })}\n`,
  );
}

runMigrationsForRelease().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({
      event: "migration_release_failed",
      detail: formatMigrationError(error),
    })}\n`,
  );
  process.exitCode = 1;
});
