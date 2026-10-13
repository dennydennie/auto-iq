import type { AuthenticatorTransport } from "@simplewebauthn/server";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("passkey_credentials")
export class PasskeyCredentialEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "tenant_id", type: "uuid" }) tenantId!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "credential_id", type: "text", unique: true }) credentialId!: string;
  @Column({ name: "public_key", type: "bytea" }) publicKey!: Buffer;
  @Column({ type: "bigint", default: 0 }) counter!: string;
  @Column({ type: "jsonb", default: () => "'[]'" }) transports!: AuthenticatorTransport[];
  @Column({ name: "backed_up", type: "boolean", default: false }) backedUp!: boolean;
  @Column({ type: "text", nullable: true }) label!: string | null;
  @Column({ name: "last_used_at", type: "timestamptz", nullable: true }) lastUsedAt!: Date | null;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
