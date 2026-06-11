import { Controller, Get, Res } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import { LiveResponseDto, ReadinessResponseDto } from "./health.dto";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({ summary: "Liveness probe for process availability" })
  @ApiOkResponse({ type: LiveResponseDto })
  @Get("live")
  getLive() {
    return this.healthService.getLive();
  }

  @ApiOperation({ summary: "Readiness probe for traffic-serving dependencies" })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ReadinessResponseDto })
  @Get("ready")
  async getReady(@Res({ passthrough: true }) response: { status(code: number): void }) {
    const ready = await this.healthService.getReady();
    if (ready.status !== "ok") {
      response.status(503);
    }
    return ready;
  }
}
