import { AddVehicleImagePosition1761600000000 } from "./migrations/1761600000000-AddVehicleImagePosition";

describe("AddVehicleImagePosition1761600000000", () => {
  it("backfills deterministic bounded positions and adds the query index", async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddVehicleImagePosition1761600000000().up({ query } as never);
    const sql = query.mock.calls.flat().join("\n");

    expect(sql).toContain("row_number() OVER");
    expect(sql).toContain("PARTITION BY vehicle_id");
    expect(sql).toContain("position >= 0 AND position <= 11");
    expect(sql).toContain("idx_vehicle_images_vehicle_position");
  });
});
