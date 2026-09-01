import { CreateVehicleCatalogue1761300000000 } from "./migrations/1761300000000-CreateVehicleCatalogue";

describe("CreateVehicleCatalogue1761300000000", () => {
  it("creates and seeds the tenant vehicle catalogue", async () => {
    const runner = migrationRunner();
    await new CreateVehicleCatalogue1761300000000().up(runner as never);

    const makeCalls = callsFor(runner.query, "INSERT INTO vehicle_makes");
    const modelCalls = callsFor(runner.query, "INSERT INTO vehicle_models");
    expect(makeCalls).toHaveLength(32);
    expect(modelCalls).toHaveLength(313);
    expect(makeCalls).toContainEqual(
      expect.arrayContaining(["tenant-1", "isuzu", "Isuzu"]),
    );
    expect(modelCalls).toContainEqual(
      expect.arrayContaining(["tenant-1", "make-honda", "vezel", "Vezel"]),
    );
  });

  it("upgrades the legacy catalogue in place and preserves referenced ids", async () => {
    const runner = migrationRunner({
      catalogueExists: true,
      legacyColumns: true,
    });

    await new CreateVehicleCatalogue1761300000000().up(runner as never);

    const sql = runner.query.mock.calls
      .map(([statement]) => statement)
      .join("\n");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS tenant_id");
    expect(sql).toContain("ALTER COLUMN slug DROP NOT NULL");
    expect(sql).toContain("DROP CONSTRAINT IF EXISTS uq_vehicle_makes_slug");
    expect(sql).toContain("ON CONFLICT (tenant_id, code) DO UPDATE");
    expect(sql).toContain("UPDATE vehicle_specs specs");
    expect(sql).not.toContain("CREATE TABLE vehicle_makes");
    expect(sql).not.toContain("CREATE TABLE vehicle_models");
    expect(sql).not.toContain("DROP TABLE");
  });

  it("drops models before makes", async () => {
    const query = jest.fn().mockResolvedValue([]);
    await new CreateVehicleCatalogue1761300000000().down({ query } as never);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual([
      "DROP TABLE IF EXISTS vehicle_models",
      "DROP TABLE IF EXISTS vehicle_makes",
    ]);
  });
});

type RunnerOptions = {
  catalogueExists?: boolean;
  legacyColumns?: boolean;
};

function migrationRunner(options: RunnerOptions = {}) {
  return {
    query: jest.fn(async (sql: string, params?: unknown[]) => {
      if (sql === "SELECT id FROM tenants") return [{ id: "tenant-1" }];
      if (sql.includes("INSERT INTO vehicle_makes")) {
        return [{ id: `make-${params?.[1]}` }];
      }
      return [];
    }),
    hasTable: jest.fn().mockResolvedValue(options.catalogueExists ?? false),
    hasColumn: jest.fn(async (table: string, column: string) => {
      if (table === "vehicle_specs") return options.legacyColumns ?? false;
      return column === "slug" && (options.legacyColumns ?? false);
    }),
  };
}

function callsFor(
  query: ReturnType<typeof migrationRunner>["query"],
  fragment: string,
) {
  return query.mock.calls
    .filter(([sql]) => sql.includes(fragment))
    .map(([, params]) => params);
}
