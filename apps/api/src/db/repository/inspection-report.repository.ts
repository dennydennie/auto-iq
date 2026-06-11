import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionReportEntity } from "../entity/inspection-report.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class InspectionReportRepository extends AbstractRepository<InspectionReportEntity> {
  constructor(@InjectRepository(InspectionReportEntity) repository: Repository<InspectionReportEntity>) {
    super(repository);
  }

  findByTaskId(taskId: string): Promise<InspectionReportEntity | null> {
    return this.repository.findOne({
      where: { taskId },
      relations: ["submittedByInspector", "buyerSummaryApprovedByAdmin", "findings"],
    });
  }

  findByListingId(listingId: string): Promise<InspectionReportEntity | null> {
    return this.repository.findOne({
      where: { listingId },
      relations: ["submittedByInspector", "buyerSummaryApprovedByAdmin", "findings"],
    });
  }
}
