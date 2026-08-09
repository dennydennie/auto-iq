import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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

    const nextFullName = body.fullName === undefined ? user.fullName : text(body.fullName, "Full name");
    const nextCity = body.city === undefined ? user.city : text(body.city, "City");
    const budgetMin = user.buyerProfile
      ? money(body.budgetMin, user.buyerProfile.budgetMin)
      : null;
    const budgetMax = user.buyerProfile
      ? money(body.budgetMax, user.buyerProfile.budgetMax)
      : null;
    validateBudgetRange(budgetMin, budgetMax);

    user.fullName = nextFullName;
    user.city = nextCity;
    if (user.buyerProfile) {
      user.buyerProfile.city = nextCity;
      user.buyerProfile.preferredBodyTypes = list(
        body.preferredBodyTypes,
        user.buyerProfile.preferredBodyTypes,
      );
      user.buyerProfile.preferredMakes = list(
        body.preferredMakes,
        user.buyerProfile.preferredMakes,
      );
      user.buyerProfile.budgetMin = budgetMin;
      user.buyerProfile.budgetMax = budgetMax;
    }
    if (user.sellerProfile) {
      user.sellerProfile.city = nextCity;
      if (body.businessName !== undefined) {
        user.sellerProfile.businessName = nullableText(body.businessName);
      }
    }

    await this.userRepository.save(user);

    if (user.buyerProfile) {
      await this.buyerProfileRepository.save(user.buyerProfile);
    }
    if (user.sellerProfile) {
      await this.sellerProfileRepository.save(user.sellerProfile);
    }

    return this.me(userId);
  }
}

function text(value: string, field: string) {
  const result = value.trim();
  if (!result) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: `${field} is required`,
    });
  }
  return result;
}

function nullableText(value: string | null) {
  const result = value?.trim() ?? "";
  return result || null;
}

function list(value: string[] | undefined, fallback: string[]) {
  if (value === undefined) return fallback;
  const seen = new Set<string>();
  return value.map((item) => item.trim()).filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function money(value: number | null | undefined, fallback: string | null): string | null {
  return value === undefined ? fallback : value === null ? null : value.toFixed(2);
}

function validateBudgetRange(min: string | null, max: string | null) {
  if ((min !== null && Number(min) < 0) || (max !== null && Number(max) < 0)) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: "Budgets cannot be negative",
    });
  }
  if (min !== null && max !== null && Number(min) > Number(max)) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: "Minimum budget cannot be greater than maximum budget",
    });
  }
}
