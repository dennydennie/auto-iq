import bcrypt from "bcryptjs";
import { Client } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://auto_iq:auto_iq_e2e_dev@127.0.0.1:55433/auto_iq";
const password = process.env.MOBILE_E2E_PASSWORD ?? "AutoIQ-E2E-9Pass";
const runId = normalizedRunId(process.env.MOBILE_E2E_RUN_ID);
const tenantId =
  process.env.DEFAULT_TENANT_ID ?? "11111111-1111-4111-8111-111111111111";

const accounts = {
  buyer: `mobile-web-buyer-${runId}@example.com`,
  seller: `mobile-web-seller-${runId}@example.com`,
  inspector: `mobile-web-inspector-${runId}@example.com`,
};

const client = new Client({ connectionString: databaseUrl });

await run();

async function run() {
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [
      tenantId,
    ]);
    await assertFixtureIsNew();
    const sellerId = await createUser("seller", "SELLER");
    const inspectorId = await createUser("inspector", "INSPECTOR");
    const listingId = await createInspectionListing();
    const taskId = await createInspectionTask(listingId, inspectorId);
    await client.query("COMMIT");
    console.log(
      JSON.stringify({ accounts, listingId, password, runId, taskId }),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

function normalizedRunId(value) {
  const normalized = (value ?? `${Date.now()}`)
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
  if (!normalized)
    throw new Error("MOBILE_E2E_RUN_ID must contain letters or digits");
  return normalized.slice(0, 32);
}

async function assertFixtureIsNew() {
  const result = await client.query(
    "SELECT email FROM users WHERE lower(email) = ANY($1::text[])",
    [Object.values(accounts)],
  );
  if (result.rowCount) {
    throw new Error(
      `Fixture already exists: ${result.rows.map((row) => row.email).join(", ")}`,
    );
  }
}

async function createUser(kind, role) {
  const hash = await bcrypt.hash(password, 10);
  const user = await insertUser(kind, hash);
  await insertRoleAndMembership(user.id, role);
  if (role === "SELLER") await insertSellerProfile(user.id);
  return user.id;
}

async function insertUser(kind, passwordHash) {
  const result = await client.query(
    `INSERT INTO users
       (full_name, email, phone, password_hash, status, city, phone_verified, email_verified)
     VALUES ($1, $2, $3, $4, 'ACTIVE', 'Harare', true, true)
     RETURNING id`,
    [`Mobile Web ${title(kind)}`, accounts[kind], phoneFor(kind), passwordHash],
  );
  return result.rows[0];
}

async function insertRoleAndMembership(userId, role) {
  await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [
    userId,
    role,
  ]);
  await client.query(
    `INSERT INTO tenant_memberships (tenant_id, user_id, role, active)
     VALUES ($1, $2, $3, true)`,
    [tenantId, userId, role],
  );
}

async function insertSellerProfile(userId) {
  await client.query(
    `INSERT INTO seller_profiles (user_id, city, consents_complete, verified)
     VALUES ($1, 'Harare', false, false)`,
    [userId],
  );
}

async function createInspectionListing() {
  const ownerId = await publishedSellerId();
  const vehicle = await client.query(
    `INSERT INTO vehicles (seller_user_id, slug, status, seller_disclosure, submitted_at)
     VALUES ($1, $2, 'INSPECTION_PENDING', $3, now()) RETURNING id`,
    [
      ownerId,
      `mobile-web-inspection-${runId}`,
      `Inspector E2E fixture ${runId}`,
    ],
  );
  await insertVehicleDetails(vehicle.rows[0].id);
  return vehicle.rows[0].id;
}

async function publishedSellerId() {
  const result = await client.query(
    `SELECT seller_user_id FROM vehicles
     WHERE status = 'PUBLISHED' ORDER BY published_at DESC NULLS LAST LIMIT 1`,
  );
  if (!result.rowCount)
    throw new Error("A published listing must be seeded first");
  return result.rows[0].seller_user_id;
}

async function insertVehicleDetails(listingId) {
  await client.query(
    `INSERT INTO vehicle_specs
       (vehicle_id, make, model, year, body_type, colour, fuel_type,
        transmission, drive_type, mileage_km, condition, has_accident_history)
     VALUES ($1, 'Isuzu', $2, 2022, 'BAKKIE', 'Silver', 'DIESEL',
             'AUTOMATIC', '4WD', 48000, 'GOOD', false)`,
    [listingId, `D-Max ${runId}`],
  );
  await client.query(
    `INSERT INTO vehicle_pricing (vehicle_id, ask_price_usd, negotiable)
     VALUES ($1, 28000, true)`,
    [listingId],
  );
}

async function createInspectionTask(listingId, inspectorId) {
  const snapshot = {
    year: 2022,
    make: "Isuzu",
    model: `D-Max ${runId}`,
    coverImageStorageKey: null,
    city: "Harare",
  };
  const result = await client.query(
    `INSERT INTO inspection_tasks
       (listing_id, assigned_inspector_id, status, scheduled_at, location_note, listing_snapshot)
     VALUES ($1, $2, 'SCHEDULED', now() + interval '2 days', $3, $4::jsonb)
     RETURNING id`,
    [
      listingId,
      inspectorId,
      `Mobile web E2E ${runId}`,
      JSON.stringify(snapshot),
    ],
  );
  return result.rows[0].id;
}

function phoneFor(kind) {
  const suffix = `${stableNumber(`${runId}-${kind}`)}`
    .padStart(7, "0")
    .slice(-7);
  return `+26378${suffix}`;
}

function stableNumber(value) {
  return [...value].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 10_000_000,
    7,
  );
}

function title(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
