import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TenantEntity } from "./tenant.entity";
import { UserEntity } from "./user.entity";

export type AccountDeletionRequestSource = "MOBILE" | "PUBLIC_WEB" | "WEB";
export type AccountDeletionRequestStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED";

@Entity({ name: "account_deletion_requests" })
export class AccountDeletionRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text" })
  source!: AccountDeletionRequestSource;

  @Column({ type: "text", default: "PENDING" })
  status!: AccountDeletionRequestStatus;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ name: "identity_verified", type: "boolean", default: false })
  identityVerified!: boolean;

  @Column({
    name: "data_handling_confirmed",
    type: "boolean",
    default: false,
  })
  dataHandlingConfirmed!: boolean;

  @Column({ name: "processing_note", type: "text", nullable: true })
  processingNote!: string | null;

  @Column({ name: "processed_by_user_id", type: "uuid", nullable: true })
  processedByUserId!: string | null;

  @Column({ name: "processed_at", type: "timestamptz", nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: "requested_at", type: "timestamptz" })
  requestedAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user?: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "processed_by_user_id" })
  processedBy?: UserEntity | null;
}
