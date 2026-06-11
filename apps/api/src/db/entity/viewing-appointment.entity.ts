import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ViewingStatus } from "../../common/constants/listing.constants";
import { ApprovedViewingLocationEntity } from "./approved-viewing-location.entity";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";
import { ViewingParticipantEntity } from "./viewing-participant.entity";

@Entity({ name: "viewing_appointments" })
export class ViewingAppointmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "listing_id", type: "uuid" })
  listingId!: string;

  @Column({ name: "buyer_user_id", type: "uuid" })
  buyerUserId!: string;

  @Column({ name: "seller_user_id", type: "uuid" })
  sellerUserId!: string;

  @Column({ type: "text", default: "REQUESTED" })
  status!: ViewingStatus;

  @Column({ name: "preferred_slot", type: "timestamptz" })
  preferredSlot!: Date;

  @Column({ name: "confirmed_slot", type: "timestamptz", nullable: true })
  confirmedSlot!: Date | null;

  @Column({ name: "location_id", type: "uuid" })
  locationId!: string;

  @Column({ name: "listing_snapshot", type: "jsonb" })
  listingSnapshot!: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "outcome_note", type: "text", nullable: true })
  outcomeNote!: string | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: VehicleEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_user_id" })
  buyer!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_user_id" })
  seller!: UserEntity;

  @ManyToOne(() => ApprovedViewingLocationEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "location_id" })
  location!: ApprovedViewingLocationEntity;

  @OneToMany(() => ViewingParticipantEntity, (participant) => participant.viewing)
  participants!: ViewingParticipantEntity[];
}
