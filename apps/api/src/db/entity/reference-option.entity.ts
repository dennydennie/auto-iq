import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

export const REFERENCE_OPTION_CATEGORIES = [
  "BODY_TYPE",
  "FUEL_TYPE",
  "TRANSMISSION_TYPE",
  "DRIVE_TYPE",
  "CONDITION_GRADE",
] as const;

export type ReferenceOptionCategory = (typeof REFERENCE_OPTION_CATEGORIES)[number];

@Entity({ name: "reference_options" })
@Unique("uq_reference_options_tenant_category_code", ["tenantId", "category", "code"])
export class ReferenceOptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ type: "text" })
  category!: ReferenceOptionCategory;

  @Column({ type: "text" })
  code!: string;

  @Column({ type: "text" })
  label!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
