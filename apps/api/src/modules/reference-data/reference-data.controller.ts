import { Controller, Get } from "@nestjs/common";
import { ReferenceDataService } from "./reference-data.service";

@Controller("reference-data")
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get()
  all() {
    return this.referenceDataService.getAll();
  }
}
