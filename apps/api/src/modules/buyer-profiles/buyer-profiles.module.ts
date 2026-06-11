import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { StorageModule } from "../storage/storage.module";
import { SavedVehiclesController } from "./saved-vehicles.controller";
import { SavedVehiclesService } from "./saved-vehicles.service";

@Module({
  imports: [DbModule, IdentityModule, StorageModule],
  controllers: [SavedVehiclesController],
  providers: [SavedVehiclesService],
})
export class BuyerProfilesModule {}
