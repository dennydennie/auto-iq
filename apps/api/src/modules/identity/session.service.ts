import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes } from "node:crypto";
import { UserRepository } from "../../db/repository/user.repository";
import type { AuthenticatedUser, CookieOptions, CookieResponse, CorrelatedRequest } from "../../common/types/http";
import { RedisService } from "../redis/redis.service";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class SessionService {
  constructor(
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
  ) {}

  async create(userId: string, response: CookieResponse): Promise<string> {
    const sessionId = randomBytes(32).toString("base64url");
    await this.redisService.set(this.key(sessionId), userId, SESSION_TTL_SECONDS);
    response.cookie(this.cookieName(), sessionId, {
      ...this.cookieOptions(),
      httpOnly: true,
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
    return sessionId;
  }

  async authenticateRequest(request: CorrelatedRequest): Promise<AuthenticatedUser | null> {
    const sessionId = request.cookies?.[this.cookieName()];
    if (!sessionId) {
      return null;
    }
    const userId = await this.redisService.get(this.key(sessionId));
    if (!userId) {
      return null;
    }
    const user = await this.userRepository.findProfileById(userId);
    if (!user || user.status === "SUSPENDED") {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.role),
      sessionId,
    };
  }

  async refresh(sessionId: string, response: CookieResponse): Promise<void> {
    const userId = await this.redisService.get(this.key(sessionId));
    if (!userId) {
      return;
    }
    await this.redisService.set(this.key(sessionId), userId, SESSION_TTL_SECONDS);
    response.cookie(this.cookieName(), sessionId, {
      ...this.cookieOptions(),
      httpOnly: true,
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
  }

  async destroy(request: CorrelatedRequest, response: CookieResponse): Promise<void> {
    const sessionId = request.cookies?.[this.cookieName()];
    if (sessionId) {
      await this.redisService.del(this.key(sessionId));
      await this.redisService.del(`csrf:${this.sign(sessionId)}`);
    }
    response.clearCookie(this.cookieName(), this.cookieOptions());
  }

  cookieOptions(): Pick<CookieOptions, "domain" | "path" | "sameSite" | "secure"> {
    return {
      domain: this.config.get<string>("SESSION_COOKIE_DOMAIN") || undefined,
      path: "/",
      sameSite: this.config.get<"lax" | "strict" | "none">("SESSION_COOKIE_SAME_SITE") ?? "lax",
      secure: this.config.get<boolean>("SESSION_COOKIE_SECURE")
        ?? this.config.get<string>("NODE_ENV") === "production",
    };
  }

  sessionFromRequest(request: CorrelatedRequest): string | null {
    return request.cookies?.[this.cookieName()] ?? null;
  }

  sign(value: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("SESSION_SECRET"))
      .update(value)
      .digest("hex");
  }

  private cookieName(): string {
    return this.config.getOrThrow<string>("SESSION_COOKIE_NAME");
  }

  private key(sessionId: string): string {
    return `session:${this.sign(sessionId)}`;
  }
}
