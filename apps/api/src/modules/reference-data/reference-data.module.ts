import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { ReferenceDataController } from "./reference-data.controller";
import { ReferenceDataService } from "./reference-data.service";

@Module({
  imports: [DbModule],
  controllers: [ReferenceDataController],
  providers: [ReferenceDataService],
  exports: [ReferenceDataService],
})
export class ReferenceDataModule {}
