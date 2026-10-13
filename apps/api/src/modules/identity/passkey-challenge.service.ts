import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { RedisService } from "../redis/redis.service";

type Purpose = "registration" | "authentication";

@Injectable()
export class PasskeyChallengeService {
  constructor(private readonly redis: RedisService, private readonly config: ConfigService) {}

  async issue(purpose: Purpose, challenge: string, binding = "") {
    const challengeId = randomUUID();
    await this.redis.set(this.key(purpose, challengeId), JSON.stringify({ challenge, binding }), 300);
    return challengeId;
  }

  async consume(purpose: Purpose, id: string, binding = "") {
    const value = await this.redis.take(this.key(purpose, id));
    const saved = value ? JSON.parse(value) as { challenge: string; binding: string } : null;
    if (!saved || saved.binding !== binding) throw new BadRequestException({
      code: "PASSKEY_CHALLENGE_EXPIRED", message: "That request expired. Try again.",
    });
    return saved.challenge;
  }

  private key(purpose: Purpose, id: string) {
    return `passkey:${this.config.getOrThrow<string>("DEFAULT_TENANT_ID")}:${purpose}:${id}`;
  }
}
