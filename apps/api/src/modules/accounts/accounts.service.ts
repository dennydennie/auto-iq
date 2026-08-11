import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BuyerProfileRepository } from "../../db/repository/buyer-profile.repository";
import { SellerProfileRepository } from "../../db/repository/seller-profile.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { toMeResponse } from "./account.mapper";
import { UpdateMeDto } from "./dto/accounts.dto";
import { ReferenceDataService } from "../reference-data/reference-data.service";

@Injectable()
export class AccountsService {
  constructor(
    private readonly buyerProfileRepository: BuyerProfileRepository,
    private readonly sellerProfileRepository: SellerProfileRepository,
    private readonly referenceDataService: ReferenceDataService,
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
    await Promise.all([
      this.referenceDataService.assertActive("BODY_TYPE", body.preferredBodyTypes ?? []),
      this.referenceDataService.assertActive("FUEL_TYPE", body.preferredFuelTypes ?? []),
      this.referenceDataService.assertActive("TRANSMISSION_TYPE", body.preferredTransmissions ?? []),
    ]);

    const nextFullName = body.fullName === undefined ? user.fullName : text(body.fullName, "Full name");
    const nextCity = body.city === undefined ? user.city : text(body.city, "City");
    const budgetMin = user.buyerProfile
      ? money(body.budgetMin, user.buyerProfile.budgetMin)
      : null;
    const budgetMax = user.buyerProfile
      ? money(body.budgetMax, user.buyerProfile.budgetMax)
      : null;
    const searchRadiusKm = user.buyerProfile
      ? integer(body.searchRadiusKm, user.buyerProfile.searchRadiusKm, "Search radius", 1, 1000)
      : null;
    const minSeats = user.buyerProfile
      ? integer(body.minSeats, user.buyerProfile.minSeats, "Minimum seats", 1, 100)
      : null;
    const maxMileageKm = user.buyerProfile
      ? integer(body.maxMileageKm, user.buyerProfile.maxMileageKm, "Maximum mileage", 0, 10_000_000)
      : null;
    const yearMin = user.buyerProfile
      ? integer(body.yearMin, user.buyerProfile.yearMin, "Minimum year", 1886, 2200)
      : null;
    const yearMax = user.buyerProfile
      ? integer(body.yearMax, user.buyerProfile.yearMax, "Maximum year", 1886, 2200)
      : null;
    validateBudgetRange(budgetMin, budgetMax);
    validateYearRange(yearMin, yearMax);

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
      user.buyerProfile.vehiclePurpose = optional(body.vehiclePurpose, user.buyerProfile.vehiclePurpose);
      user.buyerProfile.searchRadiusKm = searchRadiusKm;
      user.buyerProfile.deliveryPreference = optional(
        body.deliveryPreference,
        user.buyerProfile.deliveryPreference,
      );
      user.buyerProfile.paymentPreference = optional(
        body.paymentPreference,
        user.buyerProfile.paymentPreference,
      );
      user.buyerProfile.preferredFuelTypes = list(
        body.preferredFuelTypes,
        user.buyerProfile.preferredFuelTypes,
      );
      user.buyerProfile.preferredTransmissions = list(
        body.preferredTransmissions,
        user.buyerProfile.preferredTransmissions,
      );
      user.buyerProfile.minSeats = minSeats;
      user.buyerProfile.maxMileageKm = maxMileageKm;
      user.buyerProfile.yearMin = yearMin;
      user.buyerProfile.yearMax = yearMax;
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

function optional<T>(value: T | null | undefined, fallback: T | null): T | null {
  return value === undefined ? fallback : value;
}

function integer(
  value: number | null | undefined,
  fallback: number | null,
  field: string,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: `${field} must be between ${min} and ${max}`,
    });
  }
  return value;
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

function validateYearRange(min: number | null, max: number | null) {
  if (min !== null && max !== null && min > max) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: "Minimum year cannot be greater than maximum year",
    });
  }
}
