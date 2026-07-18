import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { ListingAccessModule } from "../listings/listing-access.module";
import { RedisModule } from "../redis/redis.module";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";

@Module({
  imports: [IdentityModule, ListingAccessModule, RedisModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
