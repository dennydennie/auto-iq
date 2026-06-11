import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { PaymentPlan, QuoteStatus } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "quote_requests" })
export class QuoteRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "listing_id", type: "uuid" })
  listingId!: string;

  @Column({ name: "buyer_user_id", type: "uuid" })
  buyerUserId!: string;

  @Column({ name: "offer_price_usd", type: "numeric", precision: 14, scale: 2 })
  offerPriceUsd!: string;

  @Column({ name: "ask_price_usd", type: "numeric", precision: 14, scale: 2 })
  askPriceUsd!: string;

  @Column({ name: "payment_plan", type: "text" })
  paymentPlan!: PaymentPlan;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ type: "text", default: "NEW" })
  status!: QuoteStatus;

  @Column({ name: "counter_price_usd", type: "numeric", precision: 14, scale: 2, nullable: true })
  counterPriceUsd!: string | null;

  @Column({ name: "response_note", type: "text", nullable: true })
  responseNote!: string | null;

  @Column({ name: "responded_at", type: "timestamptz", nullable: true })
  respondedAt!: Date | null;

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
}
