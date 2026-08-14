import { ExtendBuyerProfile1760520000000 } from "./migrations/1760520000000-ExtendBuyerProfile";

describe("ExtendBuyerProfile1760520000000", () => {
  it("adds every mobile buyer preference without static option constraints", async () => {
    const query = jest.fn();

    await new ExtendBuyerProfile1760520000000().up({ query } as never);

    const sql = query.mock.calls[0]?.[0] as string;
    expect(sql).toContain("vehicle_purpose");
    expect(sql).toContain("preferred_fuel_types");
    expect(sql).toContain("preferred_transmissions");
    expect(sql).toContain("max_mileage_km");
    expect(sql).toContain("year_min");
    expect(sql).not.toContain("chk_buyer_preferred_fuel_types");
    expect(sql).not.toContain("chk_buyer_preferred_transmissions");
  });
});
