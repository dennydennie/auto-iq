import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { InspectionTaskStatus } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";
import { InspectionReportEntity } from "./inspection-report.entity";

@Entity({ name: "inspection_tasks" })
export class InspectionTaskEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "listing_id", type: "uuid", unique: true })
  listingId!: string;

  @Column({ name: "assigned_inspector_id", type: "uuid", nullable: true })
  assignedInspectorId!: string | null;

  @Column({ type: "text", default: "UNASSIGNED" })
  status!: InspectionTaskStatus;

  @Column({ name: "scheduled_at", type: "timestamptz", nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ name: "location_note", type: "text", nullable: true })
  locationNote!: string | null;

  @Column({ name: "listing_snapshot", type: "jsonb" })
  listingSnapshot!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: VehicleEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "assigned_inspector_id" })
  assignedInspector?: UserEntity | null;

  @OneToOne(() => InspectionReportEntity, (report) => report.task)
  report?: InspectionReportEntity | null;
}
