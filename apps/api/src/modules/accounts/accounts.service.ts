import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BuyerProfileEntity } from "../../db/entity/buyer-profile.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { BuyerProfileRepository } from "../../db/repository/buyer-profile.repository";
import { SellerProfileRepository } from "../../db/repository/seller-profile.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { toMeResponse } from "./account.mapper";
import { UpdateMeDto } from "./dto/accounts.dto";

interface BuyerNumberUpdate {
  budgetMax: string | null;
  budgetMin: string | null;
  maxMileageKm: number | null;
  minSeats: number | null;
  searchRadiusKm: number | null;
  yearMax: number | null;
  yearMin: number | null;
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly buyerProfileRepository: BuyerProfileRepository,
    private readonly sellerProfileRepository: SellerProfileRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async me(userId: string) {
    return toMeResponse(await this.requireUser(userId));
  }

  async updateMe(userId: string, body: UpdateMeDto) {
    const user = await this.requireUser(userId);
    const fullName = requiredText(body.fullName, user.fullName, "Full name");
    const city = requiredText(body.city, user.city, "City");

    applyAccountUpdate(user, body, fullName, city);
    await this.saveProfile(user);
    return this.me(userId);
  }

  private async requireUser(userId: string) {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "User not found",
      });
    }
    return user;
  }

  private async saveProfile(user: UserEntity) {
    await this.userRepository.save(user);
    const profileSaves: Promise<unknown>[] = [];
    if (user.buyerProfile)
      profileSaves.push(this.buyerProfileRepository.save(user.buyerProfile));
    if (user.sellerProfile)
      profileSaves.push(this.sellerProfileRepository.save(user.sellerProfile));
    await Promise.all(profileSaves);
  }
}

function applyAccountUpdate(
  user: UserEntity,
  body: UpdateMeDto,
  fullName: string,
  city: string,
) {
  const buyer = user.buyerProfile
    ? buyerUpdate(body, user.buyerProfile, city)
    : null;
  user.fullName = fullName;
  user.city = city;
  if (user.buyerProfile && buyer) Object.assign(user.buyerProfile, buyer);
  if (!user.sellerProfile) return;
  user.sellerProfile.city = city;
  if (body.businessName !== undefined) {
    user.sellerProfile.businessName = nullableText(body.businessName);
  }
}

function buyerUpdate(
  body: UpdateMeDto,
  profile: BuyerProfileEntity,
  city: string,
) {
  return {
    city,
    ...buyerChoices(body, profile),
    ...buyerPreferences(body, profile),
    ...buyerNumbers(body, profile),
  };
}

function buyerChoices(body: UpdateMeDto, profile: BuyerProfileEntity) {
  return {
    vehiclePurpose: optional(body.vehiclePurpose, profile.vehiclePurpose),
    deliveryPreference: optional(
      body.deliveryPreference,
      profile.deliveryPreference,
    ),
    paymentPreference: optional(
      body.paymentPreference,
      profile.paymentPreference,
    ),
  };
}

function buyerPreferences(body: UpdateMeDto, profile: BuyerProfileEntity) {
  return {
    preferredBodyTypes: normalizedList(
      body.preferredBodyTypes,
      profile.preferredBodyTypes,
    ),
    preferredMakes: normalizedList(body.preferredMakes, profile.preferredMakes),
    preferredFuelTypes: normalizedList(
      body.preferredFuelTypes,
      profile.preferredFuelTypes,
    ),
    preferredTransmissions: normalizedList(
      body.preferredTransmissions,
      profile.preferredTransmissions,
    ),
  };
}

function buyerNumbers(body: UpdateMeDto, profile: BuyerProfileEntity) {
  const values = {
    searchRadiusKm: integer(
      body.searchRadiusKm,
      profile.searchRadiusKm,
      "Search radius",
      1,
      1000,
    ),
    minSeats: integer(body.minSeats, profile.minSeats, "Minimum seats", 1, 100),
    maxMileageKm: integer(
      body.maxMileageKm,
      profile.maxMileageKm,
      "Maximum mileage",
      0,
      10_000_000,
    ),
    yearMin: integer(body.yearMin, profile.yearMin, "Minimum year", 1886, 2200),
    yearMax: integer(body.yearMax, profile.yearMax, "Maximum year", 1886, 2200),
    budgetMin: money(body.budgetMin, profile.budgetMin),
    budgetMax: money(body.budgetMax, profile.budgetMax),
  };
  validateRanges(values);
  return values;
}

function requiredText(
  value: string | undefined,
  fallback: string,
  field: string,
) {
  if (value === undefined) return fallback;
  const normalized = value.trim();
  if (normalized) return normalized;
  throw validationError(`${field} is required`);
}

function nullableText(value: string | null) {
  return value?.trim() || null;
}

function normalizedList(value: string[] | undefined, fallback: string[]) {
  if (value === undefined) return fallback;
  const seen = new Set<string>();
  return value
    .map((item) => item.trim())
    .filter((item) => keepUnique(item, seen));
}

function keepUnique(value: string, seen: Set<string>) {
  const key = value.toLowerCase();
  if (!value || seen.has(key)) return false;
  seen.add(key);
  return true;
}

function money(
  value: number | null | undefined,
  fallback: string | null,
): string | null {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0)
    throw validationError("Budgets cannot be negative");
  return value.toFixed(2);
}

function optional<T>(
  value: T | null | undefined,
  fallback: T | null,
): T | null {
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
  if (Number.isInteger(value) && value >= min && value <= max) return value;
  throw validationError(`${field} must be between ${min} and ${max}`);
}

function validateRanges(values: BuyerNumberUpdate) {
  if (
    values.budgetMin !== null &&
    values.budgetMax !== null &&
    Number(values.budgetMin) > Number(values.budgetMax)
  ) {
    throw validationError(
      "Minimum budget cannot be greater than maximum budget",
    );
  }
  if (
    values.yearMin !== null &&
    values.yearMax !== null &&
    values.yearMin > values.yearMax
  ) {
    throw validationError("Minimum year cannot be greater than maximum year");
  }
}

function validationError(message: string) {
  return new BadRequestException({ code: "VALIDATION_FAILED", message });
}
