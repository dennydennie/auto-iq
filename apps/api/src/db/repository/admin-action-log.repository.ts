import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminActionLogEntity } from "../entity/admin-action-log.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class AdminActionLogRepository extends AbstractRepository<AdminActionLogEntity> {
  constructor(@InjectRepository(AdminActionLogEntity) repository: Repository<AdminActionLogEntity>) {
    super(repository);
  }
}
