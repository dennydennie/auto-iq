import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { NotificationStatus } from "../../common/constants/listing.constants";
import { NotificationEntity } from "./notification.entity";

@Entity({ name: "notification_attempts" })
export class NotificationAttemptEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "notification_id", type: "uuid" })
  notificationId!: string;

  @Column({ name: "attempt_number", type: "integer" })
  attemptNumber!: number;

  @Column({ type: "text" })
  status!: NotificationStatus;

  @Column({ name: "provider_ref", type: "text", nullable: true })
  providerRef!: string | null;

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => NotificationEntity, (notification) => notification.attempts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "notification_id" })
  notification!: NotificationEntity;
}
