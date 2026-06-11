import { Injectable } from "@nestjs/common";
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
  ) {}

  getLive(): LiveResponse {
    return { status: "ok" };
  }

  async getReady(): Promise<ReadinessResponse> {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.redisService.ping(),
      this.storageService.ping(),
    ]);

    return {
      status: this.toHealthStatus(db, redis, storage),
      checks: { db, redis, storage },
    };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.dataSource.query("SELECT 1");
      return "up";
    } catch {
      return "down";
    }
  }

  private toHealthStatus(...checks: CheckStatus[]): HealthStatus {
    return checks.every((check) => check === "up") ? "ok" : "error";
  }
}
