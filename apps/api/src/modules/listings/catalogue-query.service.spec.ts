import { CatalogueQueryService } from "./catalogue-query.service";

function createHarness() {
  const builder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  const service = new CatalogueQueryService({
    createQueryBuilder: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue(builder),
    }),
  } as never);
  return { builder, service };
}

describe("CatalogueQueryService", () => {
  it("always scopes catalogue queries to published listings", async () => {
    const { builder, service } = createHarness();

    await service.list({});

    expect(builder.where).toHaveBeenCalledWith("vehicle.status = 'PUBLISHED'");
  });

  it("applies inclusive minimum and maximum year filters", async () => {
    const { builder, service } = createHarness();

    await service.list({ yearMin: 2018, yearMax: 2024 });

    expect(builder.andWhere).toHaveBeenCalledWith("specs.year >= :yearMin", {
      yearMin: 2018,
    });
    expect(builder.andWhere).toHaveBeenCalledWith("specs.year <= :yearMax", {
      yearMax: 2024,
    });
  });

  it("searches the complete published catalogue with an escaped parameter", async () => {
    const { builder, service } = createHarness();

    await service.list({ query: "Hilux_100%" });

    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("specs.make ILIKE :search"),
      { search: "%Hilux\\_100\\%%" },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("seller.city ILIKE :search"),
      { search: "%Hilux\\_100\\%%" },
    );
  });

  it("applies a stable cursor after the requested sort value", async () => {
    const { builder, service } = createHarness();
    const cursor = Buffer.from(
      JSON.stringify({ sortValue: 20_000, id: "vehicle-1" }),
      "utf8",
    ).toString("base64url");

    await service.list({ cursor, sortBy: "askPriceUsd", sortDir: "DESC" });

    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("pricing.ask_price_usd < :cursorValue"),
      { cursorValue: 20_000, cursorId: "vehicle-1" },
    );
    expect(builder.limit).toHaveBeenCalledWith(21);
  });

  it("applies inclusive minimum and maximum price filters", async () => {
    const { builder, service } = createHarness();

    await service.list({ priceMin: 5_000, priceMax: 20_000 });

    expect(builder.andWhere).toHaveBeenCalledWith(
      "pricing.ask_price_usd >= :priceMin",
      { priceMin: 5_000 },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      "pricing.ask_price_usd <= :priceMax",
      { priceMax: 20_000 },
    );
  });

  it("applies inclusive minimum and maximum mileage filters", async () => {
    const { builder, service } = createHarness();

    await service.list({ mileageMin: 40_000, mileageMax: 100_000 });

    expect(builder.andWhere).toHaveBeenCalledWith(
      "specs.mileage_km >= :mileageMin",
      {
        mileageMin: 40_000,
      },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      "specs.mileage_km <= :mileageMax",
      {
        mileageMax: 100_000,
      },
    );
  });
});
