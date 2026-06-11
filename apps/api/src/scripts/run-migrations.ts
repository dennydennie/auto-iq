/**
 * Project: auto-iq
 * Module: apps/api release
 * Author: backend_developer agent
 * Date: 2026-06-09
 */
import { createRequire } from "node:module";
import type { DataSource } from "typeorm";

type MigrationDataSource = Pick<DataSource, "destroy" | "initialize" | "isInitialized" | "runMigrations">;

async function loadMigrationDataSource(): Promise<MigrationDataSource> {
  const module = await import("../config/database.config");
  return module.default;
}

/**
 * Runs compiled TypeORM migrations for the production release flow.
 */
export async function runMigrationsForRelease(
  migrationDataSource?: MigrationDataSource,
): Promise<void> {
  const activeDataSource = migrationDataSource ?? (await loadMigrationDataSource());

  await activeDataSource.initialize();

  try {
    await activeDataSource.runMigrations({ transaction: "all" });
  } finally {
    if (activeDataSource.isInitialized) {
      await activeDataSource.destroy();
    }
  }
}

const requireFromModule = createRequire(__filename);

function isDirectExecution(): boolean {
  return requireFromModule.main?.filename === __filename;
}

async function main(): Promise<void> {
  await runMigrationsForRelease();
}

function formatMigrationError(error: unknown): string {
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

if (isDirectExecution()) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        event: "migration_release_failed",
        detail: formatMigrationError(error),
      })}\n`,
    );
    process.exitCode = 1;
  });
}
