import { Controller, ForbiddenException, Get, Headers, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getRoot() {
    return this.appService.getApiInfo();
  }

  @Get("_ops/test-error")
  raiseTestError(@Headers("x-debug-token") debugToken?: string) {
    if (this.configService.get<boolean>("ENABLE_TEST_ERROR_ROUTE") !== true) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Route not found",
      });
    }

    const expected = this.configService.get<string>("DEBUG_TEST_ERROR_TOKEN");
    if (!expected || debugToken !== expected) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Invalid debug token",
      });
    }

    throw new Error("Sentry smoke test error");
  }
}
