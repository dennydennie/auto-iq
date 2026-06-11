import { BuyerProfileEntity } from "../../db/entity/buyer-profile.entity";
import { SellerProfileEntity } from "../../db/entity/seller-profile.entity";
import { UserConsentEntity } from "../../db/entity/user-consent.entity";
import { UserEntity } from "../../db/entity/user.entity";

export function toMeResponse(user: UserEntity) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((role) => role.role),
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    buyerProfile: user.buyerProfile ? toBuyerProfile(user.buyerProfile) : null,
    sellerProfile: user.sellerProfile ? toSellerProfile(user.sellerProfile) : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toConsentsResponse(consents: UserConsentEntity[], complete: boolean) {
  return {
    consents: consents.map((consent) => ({
      id: consent.id,
      consentType: consent.consentType,
      version: consent.version,
      acceptedAt: consent.acceptedAt.toISOString(),
      createdAt: consent.createdAt.toISOString(),
      updatedAt: consent.updatedAt.toISOString(),
    })),
    complete,
  };
}

function toBuyerProfile(profile: BuyerProfileEntity) {
  return {
    id: profile.id,
    city: profile.city,
    preferredBodyTypes: profile.preferredBodyTypes,
    preferredMakes: profile.preferredMakes,
    budgetMin: profile.budgetMin === null ? null : Number(profile.budgetMin),
    budgetMax: profile.budgetMax === null ? null : Number(profile.budgetMax),
  };
}

function toSellerProfile(profile: SellerProfileEntity) {
  return {
    id: profile.id,
    businessName: profile.businessName,
    city: profile.city,
    consentsComplete: profile.consentsComplete,
    verified: profile.verified,
  };
}
