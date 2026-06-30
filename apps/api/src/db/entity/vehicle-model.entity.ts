import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { VehicleMakeEntity } from "./vehicle-make.entity";

@Entity({ name: "vehicle_models" })
export class VehicleModelEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "make_id", type: "uuid" })
  makeId!: string;

  @Column({ type: "text" })
  slug!: string;

  @Column({ type: "text" })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleMakeEntity, (make) => make.models, { onDelete: "CASCADE" })
  @JoinColumn({ name: "make_id" })
  make!: VehicleMakeEntity;
}
