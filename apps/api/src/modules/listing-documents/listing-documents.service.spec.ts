import { ListingDocumentsService } from "./listing-documents.service";

describe("ListingDocumentsService", () => {
  it("deletes only an owned listing document and its object", async () => {
    const document = {
      id: "document-1",
      vehicleId: "listing-1",
      storageKey: "seller-documents/document-1.pdf",
    };
    const tryDeleteObject = jest.fn().mockResolvedValue(true);
    const remove = jest.fn().mockResolvedValue(document);
    const service = new ListingDocumentsService(
      {
        getOwnedEditableListing: jest
          .fn()
          .mockResolvedValue({ id: "listing-1" }),
      } as never,
      { tryDeleteObject } as never,
      {
        findById: jest.fn().mockResolvedValue(document),
        remove,
      } as never,
    );

    await expect(
      service.remove("seller-1", "listing-1", "document-1"),
    ).resolves.toEqual({ deleted: true });
    expect(remove).toHaveBeenCalledWith(document);
    expect(tryDeleteObject).toHaveBeenCalledWith(document.storageKey);
  });

  it("rejects a document belonging to another listing", async () => {
    const service = new ListingDocumentsService(
      {
        getOwnedEditableListing: jest
          .fn()
          .mockResolvedValue({ id: "listing-1" }),
      } as never,
      {} as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: "document-1",
          vehicleId: "listing-2",
        }),
      } as never,
    );

    await expect(
      service.remove("seller-1", "listing-1", "document-1"),
    ).rejects.toMatchObject({ response: { code: "RESOURCE_NOT_FOUND" } });
  });
});
