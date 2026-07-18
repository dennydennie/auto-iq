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
        getOwnedEditableListing: jest.fn().mockResolvedValue({ id: "listing-1" }),
      } as never,
      {
        inspectPendingUpload: jest.fn().mockResolvedValue({
          storageKey: "listing-images/2026/06/new.jpg",
          contentType: "image/jpeg",
          byteSize: 1024,
        }),
        completePendingUpload: jest.fn().mockResolvedValue(undefined),
        getDisplayUrl: jest.fn().mockResolvedValue("https://files.example/new.jpg"),
      } as never,
      {
        findByVehicleId: jest.fn().mockResolvedValue([
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
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ isCover: true }));
    expect(result.isCover).toBe(true);
  });
});
