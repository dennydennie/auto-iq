import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountDeletionRequestEntity } from "../entity/account-deletion-request.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class AccountDeletionRequestRepository extends AbstractRepository<AccountDeletionRequestEntity> {
  constructor(
    @InjectRepository(AccountDeletionRequestEntity)
    repository: Repository<AccountDeletionRequestEntity>,
  ) {
    super(repository);
  }

  findPendingByEmail(email: string) {
    return this.repository
      .createQueryBuilder("request")
      .where("lower(request.email) = lower(:email)", { email })
      .andWhere("request.status = :status", { status: "PENDING" })
      .getOne();
  }

  findPendingByUser(userId: string) {
    return this.repository.findOne({
      where: { status: "PENDING", userId },
    });
  }
}
