import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type {
  BodyType,
  ConditionGrade,
  DriveType,
  FuelType,
  TransmissionType,
} from "../../common/constants/listing.constants";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_specs" })
export class VehicleSpecsEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vehicle_id", type: "uuid", unique: true })
  vehicleId!: string;

  @Column({ type: "text" })
  make!: string;

  @Column({ name: "make_id", type: "uuid", nullable: true })
  makeId!: string | null;

  @Column({ type: "text" })
  model!: string;

  @Column({ name: "model_id", type: "uuid", nullable: true })
  modelId!: string | null;

  @Column({ type: "integer" })
  year!: number;

  @Column({ name: "body_type", type: "text" })
  bodyType!: BodyType;

  @Column({ type: "text" })
  colour!: string;

  @Column({ name: "fuel_type", type: "text" })
  fuelType!: FuelType;

  @Column({ type: "text" })
  transmission!: TransmissionType;

  @Column({ name: "drive_type", type: "text" })
  driveType!: DriveType;

  @Column({ name: "engine_capacity", type: "text", nullable: true })
  engineCapacity!: string | null;

  @Column({ name: "mileage_km", type: "integer" })
  mileageKm!: number;

  @Column({ type: "text" })
  condition!: ConditionGrade;

  @Column({ name: "has_accident_history", type: "boolean", default: false })
  hasAccidentHistory!: boolean;

  @Column({ name: "accident_note", type: "text", nullable: true })
  accidentNote!: string | null;

  @Column({ name: "location_latitude", type: "numeric", precision: 9, scale: 6, nullable: true })
  locationLatitude!: string | null;

  @Column({ name: "location_longitude", type: "numeric", precision: 9, scale: 6, nullable: true })
  locationLongitude!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => VehicleEntity, (vehicle) => vehicle.specs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: VehicleEntity;
}
