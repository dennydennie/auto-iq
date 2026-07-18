import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";

type CheckStatus = "up" | "down";
type HealthStatus = "ok" | "error";

export interface LiveResponse {
  status: "ok";
}

export interface ReadinessResponse {
  status: HealthStatus;
  checks: {
    db: CheckStatus;
    redis: CheckStatus;
    storage: CheckStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly config?: ConfigService,
  ) {}

  getLive(): LiveResponse {
    return { status: "ok" };
  }

  async getReady(): Promise<ReadinessResponse> {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.withTimeout(this.redisService.ping()).catch(() => "down" as const),
      this.withTimeout(this.storageService.ping()).catch(() => "down" as const),
    ]);

    return {
      status: this.toHealthStatus(db, redis, storage),
      checks: { db, redis, storage },
    };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.withTimeout(this.dataSource.query("SELECT 1"));
      return "up";
    } catch {
      return "down";
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutMs = this.config?.get<number>("REQUEST_TIMEOUT_MS") ?? 10_000;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("health check timeout")), timeoutMs);
      promise.then(resolve, reject).finally(() => clearTimeout(timer));
    });
  }

  private toHealthStatus(...checks: CheckStatus[]): HealthStatus {
    return checks.every((check) => check === "up") ? "ok" : "error";
  }
}
