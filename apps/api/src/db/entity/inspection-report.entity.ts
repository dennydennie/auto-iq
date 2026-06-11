import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { InspectionFindingEntity } from "./inspection-finding.entity";
import { InspectionTaskEntity } from "./inspection-task.entity";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "inspection_reports" })
export class InspectionReportEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "task_id", type: "uuid", unique: true })
  taskId!: string;

  @Column({ name: "listing_id", type: "uuid" })
  listingId!: string;

  @Column({ name: "submitted_by_inspector_id", type: "uuid" })
  submittedByInspectorId!: string;

  @Column({ name: "overall_score", type: "integer" })
  overallScore!: number;

  @Column({ type: "boolean" })
  roadworthy!: boolean;

  @Column({ name: "inspector_note", type: "text" })
  inspectorNote!: string;

  @Column({ name: "buyer_note", type: "text", nullable: true })
  buyerNote!: string | null;

  @Column({ name: "buyer_summary_approved", type: "boolean", default: false })
  buyerSummaryApproved!: boolean;

  @Column({ name: "buyer_summary_approved_at", type: "timestamptz", nullable: true })
  buyerSummaryApprovedAt!: Date | null;

  @Column({ name: "buyer_summary_approved_by_admin_id", type: "uuid", nullable: true })
  buyerSummaryApprovedByAdminId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => InspectionTaskEntity, (task) => task.report, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: InspectionTaskEntity;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: VehicleEntity;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "submitted_by_inspector_id" })
  submittedByInspector!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "buyer_summary_approved_by_admin_id" })
  buyerSummaryApprovedByAdmin?: UserEntity | null;

  @OneToMany(() => InspectionFindingEntity, (finding) => finding.report)
  findings!: InspectionFindingEntity[];
}
