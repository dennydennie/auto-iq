import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ReferenceDataService } from "./reference-data.service";
import { CreateVehicleMakeDto, CreateVehicleModelDto } from "./dto/reference-data.dto";

@Controller("reference-data")
@UseGuards(AuthGuard, RolesGuard)
@Roles("SELLER", "BUYER", "ADMIN")
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get()
  all() {
    return this.referenceDataService.getAll();
  }

  @Post("makes")
  @Roles("SELLER", "ADMIN")
  @UseGuards(CsrfGuard)
  createMake(@Body() body: CreateVehicleMakeDto) {
    return this.referenceDataService.createMake(body.name);
  }

  @Post("makes/:makeId/models")
  @Roles("SELLER", "ADMIN")
  @UseGuards(CsrfGuard)
  createModel(@Param("makeId") makeId: string, @Body() body: CreateVehicleModelDto) {
    return this.referenceDataService.createModel(makeId, body.name);
  }
}
