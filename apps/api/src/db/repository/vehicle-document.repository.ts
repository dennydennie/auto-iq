import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { DocumentType } from "../../common/constants/listing.constants";
import { VehicleDocumentEntity } from "../entity/vehicle-document.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleDocumentRepository extends AbstractRepository<VehicleDocumentEntity> {
  constructor(@InjectRepository(VehicleDocumentEntity) repository: Repository<VehicleDocumentEntity>) {
    super(repository);
  }

  findByVehicleId(vehicleId: string): Promise<VehicleDocumentEntity[]> {
    return this.repository.find({ where: { vehicleId } });
  }

  findByVehicleIdAndType(
    vehicleId: string,
    documentType: DocumentType,
  ): Promise<VehicleDocumentEntity | null> {
    return this.repository.findOne({ where: { vehicleId, documentType } });
  }
}
