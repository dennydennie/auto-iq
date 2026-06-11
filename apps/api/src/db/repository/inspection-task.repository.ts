import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionTaskEntity } from "../entity/inspection-task.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class InspectionTaskRepository extends AbstractRepository<InspectionTaskEntity> {
  constructor(@InjectRepository(InspectionTaskEntity) repository: Repository<InspectionTaskEntity>) {
    super(repository);
  }

  findByListingId(listingId: string): Promise<InspectionTaskEntity | null> {
    return this.repository.findOne({
      where: { listingId },
      relations: ["assignedInspector", "report"],
    });
  }

  findByIdForInspector(id: string, inspectorId: string): Promise<InspectionTaskEntity | null> {
    return this.repository.findOne({
      where: { id, assignedInspectorId: inspectorId },
      relations: ["assignedInspector", "report"],
    });
  }

  findByIdWithRelations(id: string): Promise<InspectionTaskEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["assignedInspector", "report"],
    });
  }

  findInspectorPage(
    inspectorId: string,
    status?: InspectionTaskEntity["status"],
    page = 1,
    limit = 20,
  ): Promise<[InspectionTaskEntity[], number]> {
    const query = this.repository.createQueryBuilder("task")
      .leftJoinAndSelect("task.assignedInspector", "assignedInspector")
      .where("task.assigned_inspector_id = :inspectorId", { inspectorId });
    if (status) {
      query.andWhere("task.status = :status", { status });
    }
    return query
      .orderBy("task.scheduled_at", "ASC", "NULLS LAST")
      .addOrderBy("task.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}
