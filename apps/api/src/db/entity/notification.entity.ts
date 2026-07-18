import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";
import type { NotificationChannel, NotificationStatus } from "../../common/constants/listing.constants";
import { NotificationAttemptEntity } from "./notification-attempt.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "notifications" })
@Unique("uq_notifications_tenant_idempotency", ["tenantId", "recipientUserId", "channel", "idempotencyKey"])
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid", insert: false, update: false })
  tenantId!: string;

  @Column({ name: "recipient_user_id", type: "uuid" })
  recipientUserId!: string;

  @Column({ type: "text" })
  channel!: NotificationChannel;

  @Column({ type: "text" })
  template!: string;

  @Column({ name: "idempotency_key", type: "text" })
  idempotencyKey!: string;

  @Column({ type: "text", default: "QUEUED" })
  status!: NotificationStatus;

  @Column({ name: "recipient_address", type: "text" })
  recipientAddress!: string;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({ name: "attempt_count", type: "integer", default: 0 })
  attemptCount!: number;

  @Column({ name: "last_attempt_at", type: "timestamptz", nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ name: "retry_after", type: "timestamptz", nullable: true })
  retryAfter!: Date | null;

  @Column({ name: "provider_ref", type: "text", nullable: true })
  providerRef!: string | null;

  @Column({ name: "claim_token", type: "text", nullable: true })
  claimToken!: string | null;

  @Column({ name: "claim_expires_at", type: "timestamptz", nullable: true })
  claimExpiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipient_user_id" })
  recipient!: UserEntity;

  @OneToMany(() => NotificationAttemptEntity, (attempt) => attempt.notification)
  attempts!: NotificationAttemptEntity[];
}
