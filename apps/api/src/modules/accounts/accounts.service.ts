import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { SellerProfileEntity } from "../../db/entity/seller-profile.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { UserRoleEntity } from "../../db/entity/user-role.entity";
import { BuyerProfileRepository } from "../../db/repository/buyer-profile.repository";
import { SellerProfileRepository } from "../../db/repository/seller-profile.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { toMeResponse } from "./account.mapper";
import { UpdateMeDto } from "./dto/accounts.dto";

@Injectable()
export class AccountsService {
  constructor(
    private readonly buyerProfileRepository: BuyerProfileRepository,
    private readonly sellerProfileRepository: SellerProfileRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async me(userId: string) {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "User not found" });
    }
    return toMeResponse(user);
  }

  async updateMe(userId: string, body: UpdateMeDto) {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "User not found" });
    }

    if (body.fullName !== undefined) {
      user.fullName = body.fullName;
    }
    if (body.city !== undefined) {
      user.city = body.city;
      if (user.buyerProfile) {
        user.buyerProfile.city = body.city;
        await this.buyerProfileRepository.save(user.buyerProfile);
      }
      if (user.sellerProfile) {
        user.sellerProfile.city = body.city;
        await this.sellerProfileRepository.save(user.sellerProfile);
      }
    }
    await this.userRepository.save(user);

    if (user.buyerProfile) {
      user.buyerProfile.preferredBodyTypes =
        body.preferredBodyTypes ?? user.buyerProfile.preferredBodyTypes;
      user.buyerProfile.preferredMakes = body.preferredMakes ?? user.buyerProfile.preferredMakes;
      user.buyerProfile.budgetMin = money(body.budgetMin, user.buyerProfile.budgetMin);
      user.buyerProfile.budgetMax = money(body.budgetMax, user.buyerProfile.budgetMax);
      await this.buyerProfileRepository.save(user.buyerProfile);
    }
    if (user.sellerProfile && body.businessName !== undefined) {
      user.sellerProfile.businessName = body.businessName;
      await this.sellerProfileRepository.save(user.sellerProfile);
    }

    return this.me(userId);
  }

  async activateSeller(userId: string) {
    await this.dataSource.transaction((manager) => this.ensureSellerAccess(manager, userId));
    return this.me(userId);
  }

  private async ensureSellerAccess(manager: EntityManager, userId: string) {
    const user = await manager.findOne(UserEntity, {
      where: { id: userId },
      relations: ["roles", "sellerProfile"],
    });
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "User not found" });
    }
    await this.ensureSellerRole(manager, user);
    await this.ensureSellerProfile(manager, user);
  }

  private async ensureSellerRole(manager: EntityManager, user: UserEntity) {
    if (user.roles.some((role) => role.role === "SELLER")) {
      return;
    }
    await manager.save(UserRoleEntity, { userId: user.id, role: "SELLER" });
  }

  private async ensureSellerProfile(manager: EntityManager, user: UserEntity) {
    if (user.sellerProfile) {
      return;
    }
    await manager.save(SellerProfileEntity, {
      businessName: null,
      city: user.city,
      consentsComplete: false,
      userId: user.id,
      verified: false,
    });
  }
}

function money(value: number | undefined, fallback: string | null): string | null {
  return value === undefined ? fallback : value.toFixed(2);
}
