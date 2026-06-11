import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionFindingEntity } from "../entity/inspection-finding.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class InspectionFindingRepository extends AbstractRepository<InspectionFindingEntity> {
  constructor(@InjectRepository(InspectionFindingEntity) repository: Repository<InspectionFindingEntity>) {
    super(repository);
  }

  findByReportId(reportId: string): Promise<InspectionFindingEntity[]> {
    return this.repository.find({ where: { reportId } });
  }

  async replaceBuyerSummarySelection(reportId: string, includedFindingIds: string[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(InspectionFindingEntity)
      .set({ includeInBuyerSummary: false })
      .where("report_id = :reportId", { reportId })
      .execute();

    if (includedFindingIds.length === 0) {
      return;
    }

    await this.repository
      .createQueryBuilder()
      .update(InspectionFindingEntity)
      .set({ includeInBuyerSummary: true })
      .where("report_id = :reportId", { reportId })
      .andWhere("id IN (:...ids)", { ids: includedFindingIds })
      .execute();
  }
}
