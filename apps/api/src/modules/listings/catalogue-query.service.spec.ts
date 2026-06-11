import { CatalogueQueryService } from "./catalogue-query.service";

describe("CatalogueQueryService", () => {
  it("always scopes catalogue queries to published listings", async () => {
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

    await service.list({});

    expect(builder.where).toHaveBeenCalledWith("vehicle.status = 'PUBLISHED'");
  });
});
