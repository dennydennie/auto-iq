import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async consume(key: string, limit: number, windowSeconds: number): Promise<number> {
    const count = await this.redisService.increment(`rate:${key}`, windowSeconds);
    if (count > limit) {
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many attempts. Try again later." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return limit - count;
  }
}
