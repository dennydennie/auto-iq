import { Module } from "@nestjs/common";
import { OptionalAuthGuard } from "../../common/guards/optional-auth.guard";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { ListingAccessModule } from "./listing-access.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../storage/storage.module";
import { CatalogueController } from "./catalogue.controller";
import { CatalogueQueryService } from "./catalogue-query.service";
import { CatalogueService } from "./catalogue.service";
import { ListingsController } from "./listings.controller";
import { ListingStateService } from "./listing-state.service";
import { ListingsService } from "./listings.service";
import { ListingWizardValidator } from "./listing-wizard.validator";
import { PublicListingMapper } from "./public-listing.mapper";

@Module({
  imports: [AuditModule, DbModule, IdentityModule, ListingAccessModule, NotificationsModule, StorageModule],
  controllers: [ListingsController, CatalogueController],
  providers: [
    CatalogueQueryService,
    CatalogueService,
    ListingsService,
    ListingStateService,
    ListingWizardValidator,
    OptionalAuthGuard,
    PublicListingMapper,
  ],
  exports: [CatalogueService, ListingsService, ListingStateService, PublicListingMapper, ListingAccessModule],
})
export class ListingsModule {}
