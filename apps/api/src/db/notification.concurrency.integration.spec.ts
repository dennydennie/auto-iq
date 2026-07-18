import { randomUUID } from "node:crypto";
import { Client } from "pg";

const runIntegration = process.env.RUN_NOTIFICATION_INTEGRATION === "true";
const TENANT_ID = "11111111-1111-4111-8111-111111111111";

(runIntegration ? describe : describe.skip)("notification concurrency integration", () => {
  it("lets only one worker claim a retry row", async () => {
    const owner = new Client({ connectionString: process.env.DATABASE_URL });
    const userId = randomUUID();
    const notificationId = randomUUID();
    await owner.connect();
    await seedNotification(owner, userId, notificationId);

    const workers = [new Client({ connectionString: process.env.DATABASE_URL }), new Client({ connectionString: process.env.DATABASE_URL })];
    await Promise.all(workers.map((worker) => worker.connect()));
    try {
      await Promise.all(workers.map((worker) => worker.query("SELECT set_config('app.tenant_id', $1, false)", [TENANT_ID])));
      await Promise.all(workers.map((worker) => worker.query("BEGIN")));
      const claims = await Promise.all(workers.map((worker) => worker.query(claimQuery())));

      expect(claims.reduce((total, result) => total + (result.rowCount ?? 0), 0)).toBe(1);
      await Promise.all(workers.map((worker) => worker.query("COMMIT")));
    } finally {
      await Promise.all(workers.map((worker) => worker.end()));
      await owner.query("SELECT set_config('app.tenant_id', $1, false)", [TENANT_ID]);
      await owner.query("DELETE FROM notifications WHERE id = $1", [notificationId]);
      await owner.query("DELETE FROM users WHERE id = $1", [userId]);
      await owner.end();
    }
  });
});

async function seedNotification(owner: Client, userId: string, notificationId: string): Promise<void> {
  await owner.query("SELECT set_config('app.tenant_id', $1, false)", [TENANT_ID]);
  await owner.query(
    `INSERT INTO users (id, full_name, email, phone, password_hash, status, city)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)`,
    [userId, "Concurrency Test", `${userId}@example.invalid`, `+26377${userId.slice(0, 7)}`, "test", "Test City"],
  );
  await owner.query(
    `INSERT INTO notifications
      (id, recipient_user_id, channel, template, idempotency_key, status, recipient_address, payload, retry_after, tenant_id)
     VALUES ($1, $2, 'EMAIL', 'TEST', $3, 'FAILED', 'test@example.invalid', '{}'::jsonb, now() - interval '1 second', $4)`,
    [notificationId, userId, `concurrency:${notificationId}`, TENANT_ID],
  );
}

function claimQuery(): string {
  return `
    SELECT id FROM notifications
    WHERE status = 'FAILED'
      AND retry_after IS NOT NULL
      AND retry_after <= now()
      AND (claim_expires_at IS NULL OR claim_expires_at <= now())
    ORDER BY retry_after ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  `;
}
