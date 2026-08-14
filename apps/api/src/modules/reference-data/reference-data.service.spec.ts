import { ReferenceDataService } from "./reference-data.service";

describe("ReferenceDataService", () => {
  it("returns active database-backed makes and models", async () => {
    const locations = { findActive: jest.fn().mockResolvedValue([]) };
    const makes = {
      findActiveCatalogue: jest.fn().mockResolvedValue([
        {
          code: "honda",
          name: "Honda",
          logoUrl: null,
          models: [{ name: "Vezel" }, { name: "Fit" }],
        },
      ]),
    };
    const service = new ReferenceDataService(locations as never, makes as never);

    const result = await service.getAll();

    expect(result.makes).toEqual([
      { id: "honda", name: "Honda", logoUrl: null, popularModels: ["Vezel", "Fit"] },
    ]);
  });
});
