import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SellerProfileEntity } from "../entity/seller-profile.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class SellerProfileRepository extends AbstractRepository<SellerProfileEntity> {
  constructor(@InjectRepository(SellerProfileEntity) repository: Repository<SellerProfileEntity>) {
    super(repository);
  }

  findByUserId(userId: string): Promise<SellerProfileEntity | null> {
    return this.repository.findOne({ where: { userId } });
  }
}
