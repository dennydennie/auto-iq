import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { ListingStatus } from "../../common/constants/listing.constants";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_status_history" })
export class VehicleStatusHistoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vehicle_id", type: "uuid" })
  vehicleId!: string;

  @Column({ type: "text" })
  status!: ListingStatus;

  @Column({ name: "actor_id", type: "uuid", nullable: true })
  actorId!: string | null;

  @Column({ name: "actor_role", type: "text" })
  actorRole!: string;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "occurred_at", type: "timestamptz" })
  occurredAt!: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.history, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: VehicleEntity;
}
