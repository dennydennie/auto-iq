import { ExtendBuyerProfile1760900000000 } from "./migrations/1760900000000-ExtendBuyerProfile";

const CONSTRAINT_NAMES = [
  "chk_buyer_vehicle_purpose",
  "chk_buyer_search_radius",
  "chk_buyer_delivery_preference",
  "chk_buyer_payment_preference",
  "chk_buyer_preferred_fuel_types",
  "chk_buyer_preferred_transmissions",
  "chk_buyer_min_seats",
  "chk_buyer_max_mileage",
  "chk_buyer_years",
];

describe("ExtendBuyerProfile migration", () => {
  it("reconciles schemas created by the legacy migration", async () => {
    const query = jest.fn((sql: string) =>
      Promise.resolve(sql.includes("SELECT 1") ? [] : undefined),
    );

    await new ExtendBuyerProfile1760900000000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join("\n");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS vehicle_purpose");
    for (const name of CONSTRAINT_NAMES) {
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("conname = $1"),
        [name],
      );
      expect(sql).toContain(`ADD CONSTRAINT ${name}`);
    }
  });

  it("does not recreate constraints that already exist", async () => {
    const query = jest.fn((sql: string) =>
      Promise.resolve(
        sql.includes("SELECT 1") ? [{ exists: true }] : undefined,
      ),
    );

    await new ExtendBuyerProfile1760900000000().up({ query } as never);

    const constraintWrites = query.mock.calls.filter(([sql]) =>
      sql.includes("ADD CONSTRAINT"),
    );
    expect(constraintWrites).toHaveLength(0);
  });
});
