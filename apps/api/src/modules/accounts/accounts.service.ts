import { Injectable, NotFoundException } from "@nestjs/common";
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
}

function money(value: number | undefined, fallback: string | null): string | null {
  return value === undefined ? fallback : value.toFixed(2);
}
