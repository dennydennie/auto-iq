import { ReferenceDataService } from "./reference-data.service";

describe("ReferenceDataService", () => {
  it("returns persisted vehicle makes with model IDs", async () => {
    const locationRepository = { findActive: jest.fn().mockResolvedValue([]) };
    const taxonomyRepository = {
      findAllWithModels: jest.fn().mockResolvedValue([
        {
          id: "make-1",
          name: "Subaru",
          logoUrl: null,
          models: [{ id: "model-1", makeId: "make-1", name: "Forester" }],
        },
      ]),
    };
    const service = new (ReferenceDataService as new (...args: unknown[]) => ReferenceDataService)(
      locationRepository,
      taxonomyRepository,
    );

    const result = await service.getAll();

    expect(result.makes).toEqual([
      {
        id: "make-1",
        name: "Subaru",
        logoUrl: null,
        popularModels: ["Forester"],
        models: [{ id: "model-1", makeId: "make-1", name: "Forester" }],
      },
    ]);
  });
});
