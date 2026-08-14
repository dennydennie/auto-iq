import { CreateVehicleCatalogue1760510000000 } from "./migrations/1760510000000-CreateVehicleCatalogue";

describe("CreateVehicleCatalogue1760510000000", () => {
  it("creates and seeds the compatibility catalogue", async () => {
    const query = migrationQuery();
    await new CreateVehicleCatalogue1760510000000().up({ query } as never);

    const makeCalls = callsFor(query, "INSERT INTO vehicle_catalogue_makes");
    const modelCalls = callsFor(query, "INSERT INTO vehicle_catalogue_models");
    expect(makeCalls).toHaveLength(32);
    expect(modelCalls).toHaveLength(313);
    expect(makeCalls).toContainEqual(expect.arrayContaining(["isuzu", "Isuzu"]));
    expect(modelCalls).toContainEqual(
      expect.arrayContaining(["make-honda", "vezel", "Vezel"]),
    );
  });
});

function migrationQuery() {
  return jest.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes("INSERT INTO vehicle_catalogue_makes")) {
      return [{ id: `make-${params?.[0]}` }];
    }
    return [];
  });
}

function callsFor(query: ReturnType<typeof migrationQuery>, fragment: string) {
  return query.mock.calls
    .filter(([sql]) => sql.includes(fragment))
    .map(([, params]) => params);
}
