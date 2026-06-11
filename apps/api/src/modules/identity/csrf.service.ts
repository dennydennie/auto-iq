import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { CookieResponse } from "../../common/types/http";
import { RedisService } from "../redis/redis.service";
import { SessionService } from "./session.service";

const CSRF_TTL_SECONDS = 60 * 60 * 2;

@Injectable()
export class CsrfService {
  constructor(
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly sessionService: SessionService,
  ) {}

  async issue(sessionId: string | null, response: CookieResponse) {
    const token = randomBytes(32).toString("base64url");
    if (sessionId) {
      await this.redisService.set(this.key(sessionId), token, CSRF_TTL_SECONDS);
    }
    response.cookie(this.cookieName(), token, {
      ...this.sessionService.cookieOptions(),
      httpOnly: false,
      maxAge: CSRF_TTL_SECONDS * 1000,
    });
    return { token, headerName: this.headerName() };
  }

  async verify(sessionId: string, token: string): Promise<boolean> {
    const stored = await this.redisService.get(this.key(sessionId));
    return stored === token;
  }

  private key(sessionId: string): string {
    return `csrf:${this.sessionService.sign(sessionId)}`;
  }

  private cookieName(): string {
    return this.config.getOrThrow<string>("CSRF_COOKIE_NAME");
  }

  private headerName(): "X-CSRF-Token" {
    return "X-CSRF-Token";
  }
}
