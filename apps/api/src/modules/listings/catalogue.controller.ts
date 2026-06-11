import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { OptionalAuthGuard } from "../../common/guards/optional-auth.guard";
import type { CorrelatedRequest } from "../../common/types/http";
import { CatalogueQueryDto } from "./dto/catalogue.dto";
import { CatalogueService } from "./catalogue.service";

@Controller("listings")
@UseGuards(OptionalAuthGuard)
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get()
  list(@Query() query: CatalogueQueryDto) {
    return this.catalogueService.list(query);
  }

  @Get(":slugOrId/inspection-summary")
  inspectionSummary(@Param("slugOrId") slugOrId: string) {
    return this.catalogueService.inspectionSummary(slugOrId);
  }

  @Get(":slugOrId")
  detail(@Param("slugOrId") slugOrId: string, @Req() request: CorrelatedRequest) {
    return this.catalogueService.detail(slugOrId, request.currentUser);
  }
}
