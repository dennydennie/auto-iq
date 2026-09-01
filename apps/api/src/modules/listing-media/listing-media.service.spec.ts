import { ListingMediaService } from "./listing-media.service";

describe("ListingMediaService", () => {
  it("clears the previous cover when a new cover image is registered", async () => {
    const clearCover = jest.fn().mockResolvedValue(undefined);
    const save = jest.fn().mockImplementation(async (image) => ({
      id: "image-2",
      createdAt: new Date("2026-06-08T10:00:00.000Z"),
      ...image,
    }));
    const service = new ListingMediaService(
      {
        getOwnedEditableListing: jest
          .fn()
          .mockResolvedValue({ id: "listing-1" }),
      } as never,
      {
        inspectPendingUpload: jest.fn().mockResolvedValue({
          storageKey: "listing-images/2026/06/new.jpg",
          contentType: "image/jpeg",
          byteSize: 1024,
        }),
        completePendingUpload: jest.fn().mockResolvedValue(undefined),
        getDisplayUrl: jest
          .fn()
          .mockResolvedValue("https://files.example/new.jpg"),
        tryDeleteObject: jest.fn().mockResolvedValue(true),
      } as never,
      {
        findByVehicleId: jest
          .fn()
          .mockResolvedValue([
            { id: "image-1", slot: "FRONT_THREE_QUARTER", isCover: true },
          ]),
        findByVehicleIdAndSlot: jest.fn().mockResolvedValue(null),
        clearCover,
        create: jest.fn().mockImplementation((input) => input),
        save,
      } as never,
    );

    const result = await service.register("seller-1", "listing-1", {
      storageKey: "listing-images/2026/06/new.jpg",
      slot: "REAR_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 1024,
      isCover: true,
    });

    expect(clearCover).toHaveBeenCalledWith("listing-1");
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ isCover: true }),
    );
    expect(result.isCover).toBe(true);
  });

  it("reorders every owned image and persists stable positions", async () => {
    const images = [
      makeImage("image-1", 0),
      makeImage("image-2", 1),
      makeImage("image-3", 2),
    ];
    const saveAll = jest.fn().mockImplementation(async (value) => value);
    const service = makeService({ images, saveAll });

    const result = await service.reorder("seller-1", "listing-1", [
      "image-3",
      "image-1",
      "image-2",
    ]);

    expect(saveAll).toHaveBeenCalledWith([
      expect.objectContaining({ id: "image-3", position: 0 }),
      expect.objectContaining({ id: "image-1", position: 1 }),
      expect.objectContaining({ id: "image-2", position: 2 }),
    ]);
    expect(result.map((image) => image.id)).toEqual([
      "image-3",
      "image-1",
      "image-2",
    ]);
  });

  it("rejects an incomplete image order", async () => {
    const service = makeService({
      images: [makeImage("image-1", 0), makeImage("image-2", 1)],
    });

    await expect(
      service.reorder("seller-1", "listing-1", ["image-1"]),
    ).rejects.toMatchObject({ response: { code: "INVALID_IMAGE_ORDER" } });
  });

  it("rejects duplicate ids even when the requested length matches", async () => {
    const service = makeService({
      images: [makeImage("image-1", 0), makeImage("image-2", 1)],
    });

    await expect(
      service.reorder("seller-1", "listing-1", ["image-1", "image-1"]),
    ).rejects.toMatchObject({ response: { code: "INVALID_IMAGE_ORDER" } });
  });

  it("deletes the object and promotes the first remaining photo", async () => {
    const cover = makeImage("cover", 0, true);
    const next = makeImage("next", 1);
    const tryDeleteObject = jest.fn().mockResolvedValue(true);
    const remove = jest.fn().mockResolvedValue(cover);
    const saveAll = jest.fn().mockImplementation(async (value) => value);
    const service = makeService({
      images: [next],
      findById: cover,
      tryDeleteObject,
      remove,
      saveAll,
    });

    await service.remove("seller-1", "listing-1", "cover");

    expect(remove).toHaveBeenCalledWith(cover);
    expect(saveAll).toHaveBeenCalledWith([
      expect.objectContaining({ id: "next", position: 0, isCover: true }),
    ]);
    expect(tryDeleteObject).toHaveBeenCalledWith("listing-images/cover.jpg");
  });
});

function makeService(options: {
  images: ReturnType<typeof makeImage>[];
  findById?: ReturnType<typeof makeImage>;
  tryDeleteObject?: jest.Mock;
  remove?: jest.Mock;
  saveAll?: jest.Mock;
}) {
  return new ListingMediaService(
    {
      getOwnedEditableListing: jest.fn().mockResolvedValue({ id: "listing-1" }),
    } as never,
    {
      getDisplayUrl: jest
        .fn()
        .mockImplementation(async (key) => `https://files.example/${key}`),
      tryDeleteObject: options.tryDeleteObject ?? jest.fn(),
    } as never,
    {
      findByVehicleId: jest.fn().mockResolvedValue(options.images),
      findById: jest.fn().mockResolvedValue(options.findById ?? null),
      saveAll: options.saveAll ?? jest.fn(),
      remove: options.remove ?? jest.fn(),
    } as never,
  );
}

function makeImage(id: string, position: number, isCover = false) {
  return {
    id,
    vehicleId: "listing-1",
    storageKey: `listing-images/${id}.jpg`,
    slot: "FRONT_THREE_QUARTER",
    isCover,
    position,
    createdAt: new Date("2026-06-08T10:00:00.000Z"),
  };
}
