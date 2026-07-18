import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { typeorm } from "./config/database.config";
import { validateEnv } from "./config/env.validation";
import { DbModule } from "./db/db.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AdminOpsModule } from "./modules/admin-ops/admin-ops.module";
import { AuditModule } from "./modules/audit/audit.module";
import { BuyerProfilesModule } from "./modules/buyer-profiles/buyer-profiles.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { InspectionsModule } from "./modules/inspections/inspections.module";
import { ListingDocumentsModule } from "./modules/listing-documents/listing-documents.module";
import { ListingMediaModule } from "./modules/listing-media/listing-media.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OwnershipVerificationModule } from "./modules/ownership-verification/ownership-verification.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { ReferenceDataModule } from "./modules/reference-data/reference-data.module";
import { SellerProfilesModule } from "./modules/seller-profiles/seller-profiles.module";
import { StorageModule } from "./modules/storage/storage.module";
import { TenancyModule } from "./modules/tenancy/tenancy.module";
import { VehicleRequestsModule } from "./modules/vehicle-requests/vehicle-requests.module";
import { ViewingsModule } from "./modules/viewings/viewings.module";
import { GlobalRateLimitGuard } from "./common/guards/global-rate-limit.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeorm], validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<TypeOrmModuleOptions>("typeorm"),
      inject: [ConfigService],
    }),
    DbModule,
    HealthModule,
    IdentityModule,
    AccountsModule,
    BuyerProfilesModule,
    SellerProfilesModule,
    ListingsModule,
    ListingMediaModule,
    ListingDocumentsModule,
    StorageModule,
    TenancyModule,
    ReferenceDataModule,
    AdminOpsModule,
    OwnershipVerificationModule,
    InspectionsModule,
    QuotesModule,
    VehicleRequestsModule,
    ViewingsModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: GlobalRateLimitGuard }],
})
export class AppModule {}
