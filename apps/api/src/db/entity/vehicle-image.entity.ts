import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { ImageSlot } from "../../common/constants/listing.constants";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_images" })
export class VehicleImageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vehicle_id", type: "uuid" })
  vehicleId!: string;

  @Column({ name: "storage_key", type: "text", unique: true })
  storageKey!: string;

  @Column({ type: "text" })
  slot!: ImageSlot;

  @Column({ name: "content_type", type: "text" })
  contentType!: string;

  @Column({ name: "byte_size", type: "integer" })
  byteSize!: number;

  @Column({ name: "is_cover", type: "boolean", default: false })
  isCover!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: VehicleEntity;
}
