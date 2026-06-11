import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ListingStatus } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";
import { VehicleDocumentEntity } from "./vehicle-document.entity";
import { VehicleImageEntity } from "./vehicle-image.entity";
import { VehiclePricingEntity } from "./vehicle-pricing.entity";
import { VehicleSpecsEntity } from "./vehicle-specs.entity";
import { VehicleStatusHistoryEntity } from "./vehicle-status-history.entity";

@Entity({ name: "vehicles" })
export class VehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "seller_user_id", type: "uuid" })
  sellerUserId!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text", default: "DRAFT" })
  status!: ListingStatus;

  @Column({ name: "seller_disclosure", type: "text", nullable: true })
  sellerDisclosure!: string | null;

  @Column({ name: "view_count", type: "integer", default: 0 })
  viewCount!: number;

  @Column({ name: "viewing_count", type: "integer", default: 0 })
  viewingCount!: number;

  @Column({ name: "quote_count", type: "integer", default: 0 })
  quoteCount!: number;

  @Column({ name: "changes_note", type: "text", nullable: true })
  changesNote!: string | null;

  @Column({ name: "admin_notes", type: "text", nullable: true })
  adminNotes!: string | null;

  @Column({ name: "submitted_at", type: "timestamptz", nullable: true })
  submittedAt!: Date | null;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_user_id" })
  seller!: UserEntity;

  @OneToOne(() => VehicleSpecsEntity, (specs) => specs.vehicle)
  specs!: VehicleSpecsEntity;

  @OneToOne(() => VehiclePricingEntity, (pricing) => pricing.vehicle)
  pricing!: VehiclePricingEntity;

  @OneToMany(() => VehicleImageEntity, (image) => image.vehicle)
  images!: VehicleImageEntity[];

  @OneToMany(() => VehicleDocumentEntity, (document) => document.vehicle)
  documents!: VehicleDocumentEntity[];

  @OneToMany(() => VehicleStatusHistoryEntity, (history) => history.vehicle)
  history!: VehicleStatusHistoryEntity[];
}
