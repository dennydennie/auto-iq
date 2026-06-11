import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

export type ConsentType =
  | "TERMS"
  | "PRIVACY"
  | "SELLER_RULES"
  | "BUYER_RULES"
  | "NO_SIDE_DEAL";

@Entity({ name: "user_consents" })
@Unique("uq_user_consents_user_type_version", ["userId", "consentType", "version"])
export class UserConsentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "consent_type", type: "text" })
  consentType!: ConsentType;

  @Column({ type: "text" })
  version!: string;

  @Column({ name: "accepted_at", type: "timestamptz" })
  acceptedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.consents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
