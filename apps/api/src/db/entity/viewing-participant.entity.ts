import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { ViewingParticipantRole } from "../../common/constants/listing.constants";
import { UserEntity } from "./user.entity";
import { ViewingAppointmentEntity } from "./viewing-appointment.entity";

@Entity({ name: "viewing_participants" })
@Unique("uq_viewing_participant", ["viewingId", "userId", "role"])
export class ViewingParticipantEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "viewing_id", type: "uuid" })
  viewingId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  role!: ViewingParticipantRole;

  @Column({ type: "boolean", default: false })
  confirmed!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => ViewingAppointmentEntity, (viewing) => viewing.participants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "viewing_id" })
  viewing!: ViewingAppointmentEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
