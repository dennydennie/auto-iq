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
