import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { UrgencyLevel, VehicleRequestStatus } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";

@Entity({ name: "vehicle_requests" })
export class VehicleRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "buyer_user_id", type: "uuid" })
  buyerUserId!: string;

  @Column({ name: "max_budget_cents", type: "integer" })
  maxBudgetCents!: number;

  @Column({ name: "make_id", type: "text", nullable: true })
  makeId!: string | null;

  @Column({ type: "text", nullable: true })
  model!: string | null;

  @Column({ name: "year_min", type: "integer", nullable: true })
  yearMin!: number | null;

  @Column({ name: "year_max", type: "integer", nullable: true })
  yearMax!: number | null;

  @Column({ name: "body_type_id", type: "text", nullable: true })
  bodyTypeId!: string | null;

  @Column({ name: "fuel_type_id", type: "text", nullable: true })
  fuelTypeId!: string | null;

  @Column({ name: "transmission_type_id", type: "text", nullable: true })
  transmissionTypeId!: string | null;

  @Column({ name: "max_odometer_km", type: "integer", nullable: true })
  maxOdometerKm!: number | null;

  @Column({ type: "text" })
  urgency!: UrgencyLevel;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "text", default: "NEW" })
  status!: VehicleRequestStatus;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "matched_listing_id", type: "uuid", nullable: true })
  matchedListingId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_user_id" })
  buyer!: UserEntity;
}
