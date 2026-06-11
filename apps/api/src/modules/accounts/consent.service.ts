import { Injectable, NotFoundException } from "@nestjs/common";
import { ConsentType } from "../../db/entity/user-consent.entity";
import { UserConsentRepository } from "../../db/repository/user-consent.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { SellerProfileRepository } from "../../db/repository/seller-profile.repository";
import { RecordConsentDto } from "./dto/accounts.dto";
import { toConsentsResponse } from "./account.mapper";

const REQUIRED_BY_ROLE: Record<string, ConsentType[]> = {
  BUYER: ["TERMS", "PRIVACY", "BUYER_RULES", "NO_SIDE_DEAL"],
  SELLER: ["TERMS", "PRIVACY", "SELLER_RULES", "NO_SIDE_DEAL"],
};

@Injectable()
export class ConsentService {
  constructor(
    private readonly sellerProfileRepository: SellerProfileRepository,
    private readonly userConsentRepository: UserConsentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async record(userId: string, body: RecordConsentDto) {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "User not found" });
    }

    const existing = await this.userConsentRepository.findOneConsent(
      userId,
      body.consentType,
      body.version,
    );
    if (!existing) {
      await this.userConsentRepository.save(
        this.userConsentRepository.create({
          userId,
          consentType: body.consentType,
          version: body.version,
          acceptedAt: new Date(),
        }),
      );
    }

    const consents = await this.userConsentRepository.findForUser(userId);
    const complete = this.isComplete(user.roles.map((role) => role.role), consents);
    if (user.sellerProfile) {
      user.sellerProfile.consentsComplete = complete;
      await this.sellerProfileRepository.save(user.sellerProfile);
    }
    return toConsentsResponse(consents, complete);
  }

  isComplete(roles: string[], consents: Array<{ consentType: ConsentType }>): boolean {
    const required = new Set(roles.flatMap((role) => REQUIRED_BY_ROLE[role] ?? []));
    const accepted = new Set(consents.map((consent) => consent.consentType));
    return [...required].every((type) => accepted.has(type));
  }
}
