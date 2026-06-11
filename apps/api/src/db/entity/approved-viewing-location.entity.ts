import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "approved_viewing_locations" })
export class ApprovedViewingLocationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "address_line_1", type: "text" })
  addressLine1!: string;

  @Column({ name: "address_line_2", type: "text", nullable: true })
  addressLine2!: string | null;

  @Column({ type: "text" })
  city!: string;

  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true })
  latitude!: string | null;

  @Column({ type: "numeric", precision: 9, scale: 6, nullable: true })
  longitude!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
