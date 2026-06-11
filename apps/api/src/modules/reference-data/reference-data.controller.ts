import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ReferenceDataService } from "./reference-data.service";

@Controller("reference-data")
@UseGuards(AuthGuard, RolesGuard)
@Roles("SELLER", "BUYER", "ADMIN")
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get()
  all() {
    return this.referenceDataService.getAll();
  }
}
