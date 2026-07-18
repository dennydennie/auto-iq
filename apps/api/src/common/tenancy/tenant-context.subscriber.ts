import type { BeforeQueryEvent } from "typeorm/subscriber/event/QueryEvent";
import { EventSubscriber } from "typeorm";
import type { TransactionCommitEvent } from "typeorm/subscriber/event/TransactionCommitEvent";
import type { TransactionRollbackEvent } from "typeorm/subscriber/event/TransactionRollbackEvent";
import type { TransactionStartEvent } from "typeorm/subscriber/event/TransactionStartEvent";
import { TenantContext } from "./tenant-context";

@EventSubscriber()
export class TenantContextSubscriber {
  async beforeQuery(event: BeforeQueryEvent<unknown>): Promise<void> {
    if (event.queryRunner.data.tenantContextUpdating) {
      return;
    }
    if (event.queryRunner.data.tenantContextKey === undefined) {
      event.queryRunner.data.tenantContextKey = null;
    }

    const context = TenantContext.current();
    const key = `${context?.tenantId ?? ""}:${context?.userId ?? ""}`;
    if (event.queryRunner.data.tenantContextKey === key) {
      return;
    }

    event.queryRunner.data.tenantContextKey = key;
    await setContext(event.queryRunner, context, isActiveTransaction(event));
  }

  async afterTransactionStart(event: TransactionStartEvent): Promise<void> {
    await setContext(event.queryRunner, TenantContext.current(), true);
  }

  async afterTransactionCommit(event: TransactionCommitEvent): Promise<void> {
    if (!event.queryRunner.isTransactionActive) {
      await clearContext(event.queryRunner);
    }
  }

  async afterTransactionRollback(event: TransactionRollbackEvent): Promise<void> {
    if (!event.queryRunner.isTransactionActive) {
      await clearContext(event.queryRunner);
    }
  }
}

function isActiveTransaction(event: BeforeQueryEvent<unknown>): boolean {
  return event.queryRunner.isTransactionActive && !/^\s*(BEGIN|START TRANSACTION)\b/i.test(event.query);
}

async function setContext(queryRunner: BeforeQueryEvent<unknown>["queryRunner"], context: ReturnType<typeof TenantContext.current>, local: boolean) {
  await queryRunner.query(
    `SELECT set_config('app.tenant_id', $1, ${local}), set_config('app.user_id', $2, ${local})`,
    [context?.tenantId ?? "", context?.userId ?? ""],
  );
}

async function clearContext(queryRunner: BeforeQueryEvent<unknown>["queryRunner"]): Promise<void> {
  queryRunner.data.tenantContextUpdating = true;
  try {
    await queryRunner.query(
      "SELECT set_config('app.tenant_id', '', false), set_config('app.user_id', '', false)",
    );
  } finally {
    queryRunner.data.tenantContextUpdating = false;
    queryRunner.data.tenantContextKey = null;
  }
}
