import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { VehicleModelEntity } from "./vehicle-model.entity";

@Entity({ name: "vehicle_makes" })
export class VehicleMakeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => VehicleModelEntity, (model) => model.make)
  models!: VehicleModelEntity[];
}
