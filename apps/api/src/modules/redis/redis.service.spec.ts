import Redis from "ioredis";
import { RedisService } from "./redis.service";

jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    status: "wait",
  })),
}));

describe("RedisService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("configures an explicit connection timeout for readiness checks", () => {
    new RedisService({
      get: jest.fn((key: string) => key === "REDIS_CONNECT_TIMEOUT_MS" ? 750 : undefined),
      getOrThrow: jest.fn(() => "redis://localhost:6379"),
    } as never);

    expect(Redis).toHaveBeenCalledWith("redis://localhost:6379", {
      lazyConnect: true,
      connectTimeout: 750,
      maxRetriesPerRequest: 1,
    });
  });
});
