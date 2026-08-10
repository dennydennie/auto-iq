import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity({ name: "buyer_profiles" })
export class BuyerProfileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId!: string;

  @Column({ type: "text" })
  city!: string;

  @Column({ name: "vehicle_purpose", type: "text", nullable: true })
  vehiclePurpose!: string | null;

  @Column({ name: "search_radius_km", type: "integer", nullable: true })
  searchRadiusKm!: number | null;

  @Column({ name: "delivery_preference", type: "text", nullable: true })
  deliveryPreference!: string | null;

  @Column({ name: "payment_preference", type: "text", nullable: true })
  paymentPreference!: string | null;

  @Column({ name: "preferred_body_types", type: "text", array: true, default: "{}" })
  preferredBodyTypes!: string[];

  @Column({ name: "preferred_makes", type: "text", array: true, default: "{}" })
  preferredMakes!: string[];

  @Column({ name: "preferred_fuel_types", type: "text", array: true, default: "{}" })
  preferredFuelTypes!: string[];

  @Column({ name: "preferred_transmissions", type: "text", array: true, default: "{}" })
  preferredTransmissions!: string[];

  @Column({ name: "min_seats", type: "smallint", nullable: true })
  minSeats!: number | null;

  @Column({ name: "max_mileage_km", type: "integer", nullable: true })
  maxMileageKm!: number | null;

  @Column({ name: "year_min", type: "smallint", nullable: true })
  yearMin!: number | null;

  @Column({ name: "year_max", type: "smallint", nullable: true })
  yearMax!: number | null;

  @Column({ name: "budget_min", type: "numeric", precision: 14, scale: 2, nullable: true })
  budgetMin!: string | null;

  @Column({ name: "budget_max", type: "numeric", precision: 14, scale: 2, nullable: true })
  budgetMax!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserEntity, (user) => user.buyerProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
