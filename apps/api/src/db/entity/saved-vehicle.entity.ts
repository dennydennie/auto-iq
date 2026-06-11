import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "saved_vehicles" })
@Unique("uq_saved_vehicles_buyer_listing", ["buyerUserId", "listingId"])
export class SavedVehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @JoinColumn({ name: "buyer_user_id" })
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  buyer!: UserEntity;

  @JoinColumn({ name: "listing_id" })
  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  listing!: VehicleEntity;

  @Column({ name: "buyer_user_id", type: "uuid" })
  buyerUserId!: string;

  @Column({ name: "listing_id", type: "uuid" })
  listingId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
