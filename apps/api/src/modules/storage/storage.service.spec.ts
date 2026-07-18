jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://storage.example/upload"),
}));

import { StorageService } from "./storage.service";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

describe("StorageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createConfig(overrides: Record<string, unknown> = {}) {
    const values: Record<string, unknown> = {
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_REGION: "us-east-1",
      STORAGE_ACCESS_KEY: "minioadmin",
      STORAGE_SECRET_KEY: "minioadmin",
      STORAGE_BUCKET: "auto-iq-local",
      STORAGE_PRESIGN_TTL_SECONDS: 900,
      STORAGE_FORCE_PATH_STYLE: true,
      MAX_IMAGE_UPLOAD_BYTES: 10 * 1024 * 1024,
      MAX_DOCUMENT_UPLOAD_BYTES: 15 * 1024 * 1024,
      ...overrides,
    };
    return {
      get: jest.fn((key: string) => values[key]),
      getOrThrow: jest.fn((key: string) => values[key]),
    } as never;
  }

  function createRedis() {
    return {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      setIfAbsent: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    } as never;
  }

  it("uses the configured TTL and image key prefix", () => {
    const service = new StorageService(
      createConfig(),
      createRedis(),
    );

    expect((service as never as { presignTtl(): number }).presignTtl()).toBe(900);
    expect(
      (service as never as { createObjectKey(kind: "image", type: string): string }).createObjectKey(
        "image",
        "image/jpeg",
      ),
    ).toMatch(/^listing-images\/\d{4}\/\d{2}\//);
  });

  it("enforces configured image and document limits before presigning", async () => {
    const service = new StorageService(createConfig(), createRedis());

    await expect(service.presignImage("seller-1", "listing-1", "FRONT_THREE_QUARTER", "image/jpeg", 10 * 1024 * 1024 + 1)).rejects.toMatchObject({
      response: expect.objectContaining({ code: "FILE_TOO_LARGE" }),
    });
    await expect(service.presignDocument("seller-1", "listing-1", "SELLER_ID", "application/pdf", 15 * 1024 * 1024 + 1)).rejects.toMatchObject({
      response: expect.objectContaining({ code: "FILE_TOO_LARGE" }),
    });
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("binds the Redis intent to the seller, listing, and upload slot", async () => {
    const redis = createRedis() as never as { get: jest.Mock; setIfAbsent: jest.Mock };
    redis.get.mockResolvedValue(JSON.stringify({
      userId: "seller-1",
      listingId: "listing-1",
      kind: "image",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 4,
    }));
    const service = new StorageService(createConfig(), redis as never);

    await expect(service.inspectPendingUpload("key", "image", {
      userId: "seller-2",
      listingId: "listing-1",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 4,
    })).rejects.toMatchObject({
      response: expect.objectContaining({ code: "UPLOAD_OWNERSHIP_MISMATCH" }),
    });
    expect(redis.setIfAbsent).not.toHaveBeenCalled();
  });

  it("rejects a replayed upload claim", async () => {
    const redis = createRedis() as never as { get: jest.Mock; setIfAbsent: jest.Mock };
    redis.get.mockResolvedValue(JSON.stringify({
      userId: "seller-1",
      listingId: "listing-1",
      kind: "image",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 4,
    }));
    redis.setIfAbsent.mockResolvedValue(false);
    const service = new StorageService(createConfig(), redis as never);

    await expect(service.inspectPendingUpload("key", "image", {
      userId: "seller-1",
      listingId: "listing-1",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 4,
    })).rejects.toMatchObject({
      response: expect.objectContaining({ code: "UPLOAD_ALREADY_REGISTERED" }),
    });
  });

  it("requires registration metadata to match the presign intent", async () => {
    const redis = createRedis() as never as { get: jest.Mock; setIfAbsent: jest.Mock };
    redis.get.mockResolvedValue(JSON.stringify({
      userId: "seller-1",
      listingId: "listing-1",
      kind: "image",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/jpeg",
      contentLength: 4,
    }));
    const service = new StorageService(createConfig(), redis as never);

    await expect(service.inspectPendingUpload("key", "image", {
      userId: "seller-1",
      listingId: "listing-1",
      slot: "FRONT_THREE_QUARTER",
      contentType: "image/png",
      contentLength: 4,
    })).rejects.toMatchObject({
      response: expect.objectContaining({ code: "UPLOAD_OWNERSHIP_MISMATCH" }),
    });
    expect(redis.setIfAbsent).not.toHaveBeenCalled();
  });

  it("always returns a presigned GET URL for private storage", async () => {
    const service = new StorageService(
      createConfig({ STORAGE_PUBLIC_BASE_URL: "https://public-assets.example" }),
      createRedis(),
    );

    await expect(service.getDisplayUrl("listing-images/2026/07/image.jpg"))
      .resolves.toBe("https://storage.example/upload");
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });
});
