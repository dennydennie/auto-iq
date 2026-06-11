/**
 * Project: auto-iq
 * Module: apps/api release
 * Author: backend_developer agent
 * Date: 2026-06-09
 */
import { runMigrationsForRelease } from "./run-migrations";

describe("runMigrationsForRelease", () => {
  it("runs migrations in a single transaction and closes the datasource", async () => {
    const migrationDataSource = {
      destroy: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockImplementation(async () => {
        migrationDataSource.isInitialized = true;
      }),
      isInitialized: false,
      runMigrations: jest.fn().mockResolvedValue([]),
    };

    await runMigrationsForRelease(migrationDataSource);

    expect(migrationDataSource.initialize).toHaveBeenCalledTimes(1);
    expect(migrationDataSource.runMigrations).toHaveBeenCalledWith({ transaction: "all" });
    expect(migrationDataSource.destroy).toHaveBeenCalledTimes(1);
  });

  it("closes the datasource when migration execution fails", async () => {
    const migrationDataSource = {
      destroy: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockImplementation(async () => {
        migrationDataSource.isInitialized = true;
      }),
      isInitialized: false,
      runMigrations: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(runMigrationsForRelease(migrationDataSource)).rejects.toThrow("boom");
    expect(migrationDataSource.destroy).toHaveBeenCalledTimes(1);
  });
});
