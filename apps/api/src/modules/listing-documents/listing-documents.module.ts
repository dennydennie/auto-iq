import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { ListingsModule } from "../listings/listings.module";
import { StorageModule } from "../storage/storage.module";
import { ListingDocumentsController } from "./listing-documents.controller";
import { ListingDocumentsService } from "./listing-documents.service";

@Module({
  imports: [DbModule, IdentityModule, ListingsModule, StorageModule],
  controllers: [ListingDocumentsController],
  providers: [ListingDocumentsService],
})
export class ListingDocumentsModule {}
