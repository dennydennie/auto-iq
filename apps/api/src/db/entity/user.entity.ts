import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BuyerProfileEntity } from "./buyer-profile.entity";
import { SellerProfileEntity } from "./seller-profile.entity";
import { UserConsentEntity } from "./user-consent.entity";
import { UserRoleEntity } from "./user-role.entity";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "full_name", type: "text" })
  fullName!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ type: "text", unique: true })
  phone!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @Column({ type: "text", default: "PENDING_VERIFICATION" })
  status!: UserStatus;

  @Column({ type: "text" })
  city!: string;

  @Column({ name: "phone_verified", type: "boolean", default: false })
  phoneVerified!: boolean;

  @Column({ name: "email_verified", type: "boolean", default: false })
  emailVerified!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => UserRoleEntity, (role) => role.user)
  roles!: UserRoleEntity[];

  @OneToMany(() => UserConsentEntity, (consent) => consent.user)
  consents!: UserConsentEntity[];

  @OneToOne(() => BuyerProfileEntity, (profile) => profile.user)
  buyerProfile?: BuyerProfileEntity | null;

  @OneToOne(() => SellerProfileEntity, (profile) => profile.user)
  sellerProfile?: SellerProfileEntity | null;
}
