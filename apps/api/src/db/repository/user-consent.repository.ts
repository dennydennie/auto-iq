import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConsentType, UserConsentEntity } from "../entity/user-consent.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class UserConsentRepository extends AbstractRepository<UserConsentEntity> {
  constructor(@InjectRepository(UserConsentEntity) repository: Repository<UserConsentEntity>) {
    super(repository);
  }

  findForUser(userId: string): Promise<UserConsentEntity[]> {
    return this.repository.find({ where: { userId }, order: { acceptedAt: "ASC" } });
  }

  findOneConsent(userId: string, consentType: ConsentType, version: string) {
    return this.repository.findOne({ where: { userId, consentType, version } });
  }
}
