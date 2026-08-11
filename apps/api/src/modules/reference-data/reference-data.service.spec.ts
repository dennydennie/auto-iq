import { BadRequestException } from "@nestjs/common";
import { ReferenceDataService } from "./reference-data.service";

function createService() {
  const locations = { findActive: jest.fn().mockResolvedValue([]) };
  const options = {
    findActive: jest.fn().mockResolvedValue([
      { category: "BODY_TYPE", code: "SUV", label: "SUV" },
      { category: "FUEL_TYPE", code: "HYDROGEN", label: "Hydrogen" },
      { category: "CONDITION_GRADE", code: "GOOD", label: "Good" },
    ]),
    findActiveCodes: jest.fn(),
  };
  return {
    locations,
    options,
    service: new ReferenceDataService(locations as never, options as never),
  };
}

describe("ReferenceDataService", () => {
  it("returns tenant catalogue options", async () => {
    const { service } = createService();
    const result = await service.getAll();
    expect(result.bodyTypes).toEqual([{ value: "SUV", label: "SUV" }]);
    expect(result.fuelTypes).toEqual([{ value: "HYDROGEN", label: "Hydrogen" }]);
    expect(result.conditionGrades).toEqual([{ value: "GOOD", label: "Good" }]);
  });

  it("rejects inactive or unknown values", async () => {
    const { options, service } = createService();
    options.findActiveCodes.mockResolvedValue(new Set(["PETROL"]));
    await expect(service.assertActive("FUEL_TYPE", ["PETROL", "HYDROGEN"]))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
