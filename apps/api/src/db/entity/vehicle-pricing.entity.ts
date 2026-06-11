import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_pricing" })
export class VehiclePricingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vehicle_id", type: "uuid", unique: true })
  vehicleId!: string;

  @Column({ name: "ask_price_usd", type: "numeric", precision: 14, scale: 2 })
  askPriceUsd!: string;

  @Column({ type: "boolean", default: false })
  negotiable!: boolean;

  @Column({ type: "text", default: "USD" })
  currency!: "USD";

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => VehicleEntity, (vehicle) => vehicle.pricing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: VehicleEntity;
}
