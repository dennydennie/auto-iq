import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationAttemptEntity } from "../entity/notification-attempt.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class NotificationAttemptRepository extends AbstractRepository<NotificationAttemptEntity> {
  constructor(@InjectRepository(NotificationAttemptEntity) repository: Repository<NotificationAttemptEntity>) {
    super(repository);
  }

  findByNotificationId(notificationId: string): Promise<NotificationAttemptEntity[]> {
    return this.repository.find({
      where: { notificationId },
      order: { attemptNumber: "ASC" },
    });
  }
}
