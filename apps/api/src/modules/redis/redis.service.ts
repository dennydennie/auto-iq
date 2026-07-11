import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: true,
      connectTimeout: config.get<number>("REDIS_CONNECT_TIMEOUT_MS") ?? 1000,
      maxRetriesPerRequest: 1,
    });
  }

  async ping(): Promise<"up" | "down"> {
    try {
      await this.connect();
      return (await this.client.ping()) === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.connect();
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    await this.connect();
    return (await this.client.set(key, value, "EX", ttlSeconds, "NX")) === "OK";
  }

  async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    await this.connect();
    const value = await this.client.incr(key);
    if (value === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return value;
  }

  async keys(pattern: string): Promise<string[]> {
    await this.connect();
    return this.client.keys(pattern);
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.client.status === "wait") {
      await this.client.connect();
    }
  }
}
