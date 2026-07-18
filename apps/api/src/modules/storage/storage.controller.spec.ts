import { StorageController } from "./storage.controller";

describe("StorageController", () => {
  it("checks editable listing ownership before presigning an image", async () => {
    const access = { getOwnedEditableListing: jest.fn().mockResolvedValue({ id: "listing-1" }) };
    const storage = { presignImage: jest.fn().mockResolvedValue({ storageKey: "key" }) };
    const controller = new StorageController(access as never, storage as never);

    await controller.presignImage(
      { id: "seller-1" } as never,
      { listingId: "listing-1", slot: "FRONT_THREE_QUARTER", contentType: "image/jpeg", contentLength: 4 },
    );

    expect(access.getOwnedEditableListing).toHaveBeenCalledWith("seller-1", "listing-1");
    expect(storage.presignImage).toHaveBeenCalledWith(
      "seller-1",
      "listing-1",
      "FRONT_THREE_QUARTER",
      "image/jpeg",
      4,
    );
  });

  it("does not call storage when listing ownership fails", async () => {
    const access = { getOwnedEditableListing: jest.fn().mockRejectedValue(new Error("not owner")) };
    const storage = { presignDocument: jest.fn() };
    const controller = new StorageController(access as never, storage as never);

    await expect(controller.presignDocument(
      { id: "seller-2" } as never,
      { listingId: "listing-2", documentType: "SELLER_ID", contentType: "application/pdf", contentLength: 4 },
    )).rejects.toThrow("not owner");
    expect(storage.presignDocument).not.toHaveBeenCalled();
  });
});
