import type { Repository } from "typeorm";
import { VehicleEntity } from "../entity/vehicle.entity";
import { VehicleRepository } from "./vehicle.repository";

describe("VehicleRepository", () => {
  it("does not compare a vehicle slug against the uuid id column", async () => {
    const repository = { findOne: jest.fn().mockResolvedValue(null) } as unknown as Repository<VehicleEntity>;
    const vehicleRepository = new VehicleRepository(repository);

    await vehicleRepository.findPublicBySlugOrId("2022-mazda-cx-5");

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { slug: "2022-mazda-cx-5" },
      relations: ["seller", "specs", "pricing", "images"],
    });
  });
});
