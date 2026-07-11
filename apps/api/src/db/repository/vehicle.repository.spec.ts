import type { Repository } from "typeorm";
import { VehicleEntity } from "../entity/vehicle.entity";
import { VehicleRepository } from "./vehicle.repository";

function sellerQueryBuilder() {
  const builder = {
    andWhere: jest.fn(),
    createQueryBuilder: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    where: jest.fn(),
  };
  for (const method of [
    "andWhere",
    "leftJoinAndSelect",
    "orderBy",
    "skip",
    "take",
    "where",
  ] as const) {
    builder[method].mockReturnValue(builder);
  }
  return builder;
}

describe("VehicleRepository", () => {
  it("sorts paginated seller listings by entity property path", async () => {
    const builder = sellerQueryBuilder();
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    } as unknown as Repository<VehicleEntity>;
    const vehicles = new VehicleRepository(repository);

    await vehicles.findSellerPage({
      sellerUserId: "seller-1",
      page: 1,
      limit: 20,
      sortBy: "updatedAt",
      sortDir: "DESC",
    });

    expect(builder.orderBy).toHaveBeenCalledWith("vehicle.updatedAt", "DESC");
  });

  it("does not compare a public slug against the UUID id column", async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = { findOne } as unknown as Repository<VehicleEntity>;
    const vehicles = new VehicleRepository(repository);

    await vehicles.findPublicBySlugOrId("2021-toyota-hilux-2");

    expect(findOne).toHaveBeenCalledWith({
      where: { slug: "2021-toyota-hilux-2" },
      relations: ["seller", "specs", "pricing", "images"],
    });
  });
});
