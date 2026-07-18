import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { ListingStateService } from "./listing-state.service";
import { SellerListingAccessService } from "./seller-listing-access.service";

@Module({
  imports: [DbModule],
  providers: [ListingStateService, SellerListingAccessService],
  exports: [SellerListingAccessService],
})
export class ListingAccessModule {}
