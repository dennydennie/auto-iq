import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuyerProfileEntity } from "../entity/buyer-profile.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class BuyerProfileRepository extends AbstractRepository<BuyerProfileEntity> {
  constructor(@InjectRepository(BuyerProfileEntity) repository: Repository<BuyerProfileEntity>) {
    super(repository);
  }

  findByUserId(userId: string): Promise<BuyerProfileEntity | null> {
    return this.repository.findOne({ where: { userId } });
  }
}
