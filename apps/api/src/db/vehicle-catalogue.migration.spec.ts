import { CreateVehicleCatalogue1761300000000 } from "./migrations/1761300000000-CreateVehicleCatalogue";

describe("CreateVehicleCatalogue1761300000000", () => {
  it("creates and seeds the tenant vehicle catalogue", async () => {
    const query = migrationQuery();
    await new CreateVehicleCatalogue1761300000000().up({ query } as never);

    const makeCalls = callsFor(query, "INSERT INTO vehicle_makes");
    const modelCalls = callsFor(query, "INSERT INTO vehicle_models");
    expect(makeCalls).toHaveLength(32);
    expect(modelCalls).toHaveLength(313);
    expect(makeCalls).toContainEqual(expect.arrayContaining(["tenant-1", "isuzu", "Isuzu"]));
    expect(modelCalls).toContainEqual(
      expect.arrayContaining(["tenant-1", "make-honda", "vezel", "Vezel"]),
    );
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

function migrationQuery() {
  return jest.fn(async (sql: string, params?: unknown[]) => {
    if (sql === "SELECT id FROM tenants") return [{ id: "tenant-1" }];
    if (sql.includes("INSERT INTO vehicle_makes")) {
      return [{ id: `make-${params?.[1]}` }];
    }
    return [];
  });
}

function callsFor(query: ReturnType<typeof migrationQuery>, fragment: string) {
  return query.mock.calls
    .filter(([sql]) => sql.includes(fragment))
    .map(([, params]) => params);
}
