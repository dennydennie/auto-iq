import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, IsNull } from "typeorm";
import { TenantContext } from "../../common/tenancy/tenant-context";
import { PasskeyCredentialEntity } from "../../db/entity/passkey-credential.entity";
import { PasskeySettingsService } from "./passkey-settings.service";

type NewCredential = Pick<PasskeyCredentialEntity, "credentialId" | "publicKey" | "counter" | "transports" | "backedUp" | "label">;

@Injectable()
export class PasskeyStoreService {
  constructor(private readonly db: DataSource, private readonly settings: PasskeySettingsService) {}

  scoped<T>(userId: string, run: () => T): T {
    return TenantContext.run({ userId, tenantId: this.settings.tenantId() }, run);
  }

  list(userId: string) {
    return this.scoped(userId, () => this.db.getRepository(PasskeyCredentialEntity).find({
      where: { tenantId: this.settings.tenantId(), userId, revokedAt: IsNull() }, order: { createdAt: "ASC" }, take: 10,
    }));
  }

  find(userId: string, credentialId: string) {
    return this.scoped(userId, () => this.db.getRepository(PasskeyCredentialEntity).findOne({
      where: { tenantId: this.settings.tenantId(), userId, credentialId, revokedAt: IsNull() },
    }));
  }

  save(userId: string, input: NewCredential) {
    return this.scoped(userId, () => this.db.transaction(async manager => {
      await manager.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
      const repository = manager.getRepository(PasskeyCredentialEntity);
      const count = await repository.countBy({ tenantId: this.settings.tenantId(), userId, revokedAt: IsNull() });
      if (count >= 10) throw new BadRequestException({
        code: "PASSKEY_LIMIT_REACHED", message: "Remove a passkey before adding another.",
      });
      return repository.save(repository.create({ ...input, userId, tenantId: this.settings.tenantId() }));
    }));
  }

  async advance(credential: PasskeyCredentialEntity, counter: number, backedUp: boolean) {
    return this.scoped(credential.userId, async () => {
      const result = await this.db.getRepository(PasskeyCredentialEntity).update(
        { tenantId: this.settings.tenantId(), id: credential.id, userId: credential.userId, counter: credential.counter, revokedAt: IsNull() },
        { counter: String(counter), backedUp, lastUsedAt: new Date() },
      );
      return result.affected === 1;
    });
  }

  async remove(userId: string, id: string) {
    return this.scoped(userId, async () => {
      const result = await this.db.getRepository(PasskeyCredentialEntity).update(
        { tenantId: this.settings.tenantId(), id, userId, revokedAt: IsNull() }, { revokedAt: new Date() },
      );
      if (!result.affected) throw new NotFoundException("Passkey not found.");
      return { removed: true };
    });
  }
}

export function publicPasskey(value: PasskeyCredentialEntity) {
  return { id: value.id, label: value.label, createdAt: value.createdAt,
    lastUsedAt: value.lastUsedAt, backedUp: value.backedUp };
}
