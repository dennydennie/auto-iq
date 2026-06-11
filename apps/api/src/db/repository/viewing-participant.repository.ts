import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ViewingParticipantEntity } from "../entity/viewing-participant.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class ViewingParticipantRepository extends AbstractRepository<ViewingParticipantEntity> {
  constructor(@InjectRepository(ViewingParticipantEntity) repository: Repository<ViewingParticipantEntity>) {
    super(repository);
  }

  findByViewingId(viewingId: string): Promise<ViewingParticipantEntity[]> {
    return this.repository.find({
      where: { viewingId },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
  }
}
