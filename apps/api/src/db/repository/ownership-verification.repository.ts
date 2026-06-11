import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OwnershipVerificationEntity } from "../entity/ownership-verification.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class OwnershipVerificationRepository extends AbstractRepository<OwnershipVerificationEntity> {
  constructor(
    @InjectRepository(OwnershipVerificationEntity) repository: Repository<OwnershipVerificationEntity>,
  ) {
    super(repository);
  }

  findByListingId(listingId: string): Promise<OwnershipVerificationEntity | null> {
    return this.repository.findOne({
      where: { listingId },
      relations: ["reviewer"],
    });
  }
}
