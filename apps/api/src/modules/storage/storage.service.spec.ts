import { StorageService } from "./storage.service";

describe("StorageService", () => {
  it("uses the configured TTL and image key prefix", () => {
    const service = new StorageService(
      {
        get: jest.fn((key: string) => {
          if (key === "STORAGE_FORCE_PATH_STYLE") {
            return true;
          }
          return undefined;
        }),
        getOrThrow: jest.fn((key: string) => {
          const values: Record<string, string> = {
            STORAGE_ENDPOINT: "http://localhost:9000",
            STORAGE_REGION: "us-east-1",
            STORAGE_ACCESS_KEY: "local-storage-access-key",
            STORAGE_SECRET_KEY: "local-storage-signing-key",
            STORAGE_BUCKET: "auto-iq-local",
            STORAGE_PRESIGN_TTL_SECONDS: "900",
          };
          return values[key];
        }),
      } as never,
      {} as never,
    );

    expect((service as never as { presignTtl(): number }).presignTtl()).toBe(900);
    expect(
      (service as never as { createObjectKey(kind: "image", type: string): string }).createObjectKey(
        "image",
        "image/jpeg",
      ),
    ).toMatch(/^listing-images\/\d{4}\/\d{2}\//);
  });
});
