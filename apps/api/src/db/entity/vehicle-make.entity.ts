import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { VehicleModelEntity } from "./vehicle-model.entity";

@Entity({ name: "vehicle_makes" })
@Unique("uq_vehicle_makes_tenant_code", ["tenantId", "code"])
@Unique("uq_vehicle_makes_tenant_id_id", ["tenantId", "id"])
export class VehicleMakeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ type: "text" })
  code!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl!: string | null;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => VehicleModelEntity, (model) => model.make)
  models!: VehicleModelEntity[];
}
