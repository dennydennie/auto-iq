import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "admin_action_logs" })
export class AdminActionLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "admin_id", type: "uuid" })
  adminId!: string;

  @Column({ type: "text" })
  action!: string;

  @Column({ name: "entity_type", type: "text" })
  entityType!: string;

  @Column({ name: "entity_id", type: "text" })
  entityId!: string;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
