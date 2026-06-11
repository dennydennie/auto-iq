import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type {
  DocumentReviewStatus,
  DocumentType,
} from "../../common/constants/listing.constants";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_documents" })
export class VehicleDocumentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vehicle_id", type: "uuid" })
  vehicleId!: string;

  @Column({ name: "storage_key", type: "text", unique: true })
  storageKey!: string;

  @Column({ name: "document_type", type: "text" })
  documentType!: DocumentType;

  @Column({ name: "content_type", type: "text" })
  contentType!: string;

  @Column({ name: "byte_size", type: "integer" })
  byteSize!: number;

  @Column({ name: "review_status", type: "text", default: "PENDING" })
  reviewStatus!: DocumentReviewStatus;

  @Column({ name: "review_note", type: "text", nullable: true })
  reviewNote!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.documents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: VehicleEntity;
}
