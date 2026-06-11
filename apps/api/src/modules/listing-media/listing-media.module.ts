import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { ListingsModule } from "../listings/listings.module";
import { StorageModule } from "../storage/storage.module";
import { ListingMediaController } from "./listing-media.controller";
import { ListingMediaService } from "./listing-media.service";

@Module({
  imports: [DbModule, IdentityModule, ListingsModule, StorageModule],
  controllers: [ListingMediaController],
  providers: [ListingMediaService],
})
export class ListingMediaModule {}
