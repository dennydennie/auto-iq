import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { TenantMembershipEntity } from "./tenant-membership.entity";

@Entity({ name: "tenants" })
export class TenantEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text" })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => TenantMembershipEntity, (membership) => membership.tenant)
  memberships!: TenantMembershipEntity[];
}
