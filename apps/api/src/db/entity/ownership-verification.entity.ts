import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { OwnershipVerificationStatus } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "ownership_verifications" })
export class OwnershipVerificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "listing_id", type: "uuid", unique: true })
  listingId!: string;

  @Column({ type: "text", default: "NOT_STARTED" })
  status!: OwnershipVerificationStatus;

  @Column({ name: "reviewer_admin_id", type: "uuid", nullable: true })
  reviewerAdminId!: string | null;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: VehicleEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewer_admin_id" })
  reviewer?: UserEntity | null;
}
