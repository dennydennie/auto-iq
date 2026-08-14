import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { VehicleMakeEntity } from "./vehicle-make.entity";

@Entity({ name: "vehicle_models" })
@Unique("uq_vehicle_models_tenant_make_code", ["tenantId", "makeId", "code"])
export class VehicleModelEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "make_id", type: "uuid" })
  makeId!: string;

  @Column({ type: "text" })
  code!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleMakeEntity, (make) => make.models, { onDelete: "RESTRICT" })
  @JoinColumn([
    { name: "tenant_id", referencedColumnName: "tenantId" },
    { name: "make_id", referencedColumnName: "id" },
  ])
  make!: VehicleMakeEntity;
}
