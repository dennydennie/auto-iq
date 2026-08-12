import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  AccountDeletionRequestEntity,
  type AccountDeletionRequestStatus,
} from "../entity/account-deletion-request.entity";
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

  findAdminPage(params: {
    page: number;
    limit: number;
    status?: AccountDeletionRequestStatus;
    search?: string;
  }) {
    const query = this.repository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.processedBy", "processedBy")
      .orderBy("request.requestedAt", "DESC")
      .addOrderBy("request.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);
    if (params.status) {
      query.andWhere("request.status = :status", { status: params.status });
    }
    if (params.search) {
      query.andWhere("request.email ILIKE :search", {
        search: `%${params.search}%`,
      });
    }
    return query.getManyAndCount();
  }

  findForAdmin(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: { processedBy: true },
    });
  }

  async processPending(
    id: string,
    values: Pick<
      AccountDeletionRequestEntity,
      | "dataHandlingConfirmed"
      | "identityVerified"
      | "processedAt"
      | "processedByUserId"
      | "processingNote"
      | "status"
    >,
  ) {
    const result = await this.repository
      .createQueryBuilder()
      .update(AccountDeletionRequestEntity)
      .set(values)
      .where("id = :id", { id })
      .andWhere("status = :pending", { pending: "PENDING" })
      .execute();
    return result.affected === 1 ? this.findForAdmin(id) : null;
  }
}
