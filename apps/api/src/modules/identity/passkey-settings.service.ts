import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasskeySettingsService {
  constructor(private readonly config: ConfigService) {}

  rpId() { return new URL(this.config.getOrThrow<string>("WEB_BASE_URL")).hostname; }

  origins() {
    const web = new URL(this.config.getOrThrow<string>("WEB_BASE_URL")).origin;
    const android = (this.config.get<string>("PASSKEY_ANDROID_ORIGINS") ?? "")
      .split(",").map(value => value.trim()).filter(Boolean);
    return [web, ...android];
  }

  tenantId() { return this.config.getOrThrow<string>("DEFAULT_TENANT_ID"); }
}
