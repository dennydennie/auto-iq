import { AddCatalogueSearchIndexes1761500000000 } from "./migrations/1761500000000-AddCatalogueSearchIndexes";

describe("AddCatalogueSearchIndexes1761500000000", () => {
  it("creates trigram indexes for every searched text field", async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddCatalogueSearchIndexes1761500000000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join("\n");
    expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    expect(sql).toContain("vehicle_specs USING gin (make gin_trgm_ops)");
    expect(sql).toContain("vehicle_specs USING gin (model gin_trgm_ops)");
    expect(sql).toContain("users USING gin (city gin_trgm_ops)");
    expect(sql).toContain("vehicles USING gin (slug gin_trgm_ops)");
  });

  it("drops only the task-owned indexes in reverse order", async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddCatalogueSearchIndexes1761500000000().down({ query } as never);

    expect(query.mock.calls.map(([statement]) => statement)).toEqual([
      "DROP INDEX IF EXISTS idx_vehicles_slug_search",
      "DROP INDEX IF EXISTS idx_users_city_search",
      "DROP INDEX IF EXISTS idx_vehicle_specs_model_search",
      "DROP INDEX IF EXISTS idx_vehicle_specs_make_search",
    ]);
  });
});
