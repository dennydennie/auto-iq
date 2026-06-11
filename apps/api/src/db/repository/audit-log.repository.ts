import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogEntity } from "../entity/audit-log.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class AuditLogRepository extends AbstractRepository<AuditLogEntity> {
  constructor(@InjectRepository(AuditLogEntity) repository: Repository<AuditLogEntity>) {
    super(repository);
  }
}
