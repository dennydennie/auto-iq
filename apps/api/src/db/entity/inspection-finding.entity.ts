import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type {
  InspectionCategory,
  InspectionFindingRating,
} from "../../common/constants/listing.constants";
import { InspectionReportEntity } from "./inspection-report.entity";

@Entity({ name: "inspection_findings" })
export class InspectionFindingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "report_id", type: "uuid" })
  reportId!: string;

  @Column({ type: "text" })
  category!: InspectionCategory;

  @Column({ type: "text" })
  label!: string;

  @Column({ type: "text" })
  rating!: InspectionFindingRating;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "photo_storage_key", type: "text", nullable: true })
  photoStorageKey!: string | null;

  @Column({ name: "include_in_buyer_summary", type: "boolean", default: false })
  includeInBuyerSummary!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => InspectionReportEntity, (report) => report.findings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: InspectionReportEntity;
}
