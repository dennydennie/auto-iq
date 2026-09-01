import { readFile } from "node:fs/promises";
import {
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import Redis from "ioredis";
import { Client } from "pg";

const mode = process.argv[2];
const databaseUrl = env(
  "DATABASE_URL",
  "postgresql://auto_iq:auto_iq_e2e_dev@127.0.0.1:55433/auto_iq",
);
const tenantId = env(
  "DEFAULT_TENANT_ID",
  "11111111-1111-4111-8111-111111111111",
);
const bucket = env("STORAGE_BUCKET", "auto-iq-e2e");
const s3 = new S3Client({
  endpoint: env("STORAGE_ENDPOINT", "http://127.0.0.1:59002"),
  region: env("STORAGE_REGION", "us-east-1"),
  forcePathStyle: true,
  credentials: {
    accessKeyId: env("STORAGE_ACCESS_KEY", "auto_iq_e2e"),
    secretAccessKey: env("STORAGE_SECRET_KEY", "auto_iq_e2e_secret"),
  },
});

await main();

async function main() {
  try {
    if (mode === "readiness") await verifyReadiness();
    else if (mode === "persistence") await verifyPersistence();
    else
      throw new Error("Usage: verify-mobile-web-e2e.mjs readiness|persistence");
  } finally {
    s3.destroy();
  }
}

async function verifyReadiness() {
  await verifyApiHealth();
  await withDatabase(verifyMigrations);
  await verifyRedis();
  await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log("REAL STACK READY");
}

async function verifyApiHealth() {
  const base = env("API_BASE", "http://127.0.0.1:54000/api/v1");
  const response = await fetch(`${base}/health/ready`, {
    signal: AbortSignal.timeout(5_000),
  });
  assert(response.ok, `API readiness returned ${response.status}`);
  const payload = await response.json();
  assert(payload.status === "ok", "API readiness status was not ok");
  for (const dependency of ["db", "redis", "storage"]) {
    assert(payload.checks?.[dependency] === "up", `${dependency} is not ready`);
  }
}

async function verifyMigrations(client) {
  const result = await client.query(
    "SELECT count(*)::int AS count FROM migrations",
  );
  assert(result.rows[0].count >= 18, "Expected at least 18 applied migrations");
}

async function verifyRedis() {
  const redis = new Redis(env("REDIS_URL", "redis://127.0.0.1:56380"), {
    connectTimeout: 2_000,
    maxRetriesPerRequest: 0,
  });
  try {
    assert((await redis.ping()) === "PONG", "Redis did not answer PING");
  } finally {
    redis.disconnect();
  }
}

async function verifyPersistence() {
  const runId = await persistedRunId();
  const context = testContext(runId);
  const state = await withDatabase((client) =>
    loadAndAssertState(client, context),
  );
  await verifyStoredObjects(state.images, state.documents, state.evidenceKey);
  console.log("REAL PERSISTENCE VERIFIED");
}

async function loadAndAssertState(client, context) {
  const users = await loadUsers(client, context);
  await assertConsents(client, users);
  await assertBuyerState(client, users.buyer.id, context.marker);
  const listing = await loadSellerListing(client, users.seller.id, context);
  const media = await loadListingMedia(client, listing.id);
  const evidenceKey = await assertInspection(
    client,
    users.inspector.id,
    context,
  );
  return { ...media, evidenceKey };
}

function testContext(runId) {
  return {
    runId,
    marker: `mobile-web-e2e-${runId}`,
    accounts: {
      buyer: `mobile-web-buyer-${runId}@example.com`,
      seller: `mobile-web-seller-${runId}@example.com`,
      inspector: `mobile-web-inspector-${runId}@example.com`,
    },
  };
}

async function loadUsers(client, context) {
  const result = await client.query(
    `SELECT id, lower(email) AS email, status, email_verified, phone_verified
     FROM users WHERE lower(email) = ANY($1::text[])`,
    [Object.values(context.accounts)],
  );
  assert(
    result.rowCount === 3,
    "Buyer, seller, and inspector were not all persisted",
  );
  const byEmail = new Map(result.rows.map((row) => [row.email, row]));
  return Object.fromEntries(
    Object.entries(context.accounts).map(([role, email]) => {
      const user = byEmail.get(email);
      assert(user?.status === "ACTIVE", `${role} user is not active`);
      assert(user.phone_verified, `${role} phone is not verified`);
      if (role !== "buyer") {
        assert(user.email_verified, `${role} email is not verified`);
      }
      return [role, user];
    }),
  );
}

async function assertConsents(client, users) {
  const expected = { buyer: 4, seller: 4, inspector: 3 };
  for (const [role, count] of Object.entries(expected)) {
    const result = await client.query(
      "SELECT count(*)::int AS count FROM user_consents WHERE user_id = $1",
      [users[role].id],
    );
    assert(
      result.rows[0].count === count,
      `${role} consent count was not ${count}`,
    );
  }
}

async function assertBuyerState(client, buyerId, marker) {
  await assertExists(
    client,
    "SELECT 1 FROM saved_vehicles WHERE buyer_user_id = $1",
    [buyerId],
    "saved vehicle",
  );
  await assertExists(
    client,
    quoteSql(),
    [buyerId, `Quote ${marker}`],
    "quote request",
  );
  await assertExists(
    client,
    viewingSql(),
    [buyerId, `Viewing ${marker}`],
    "viewing",
  );
  await assertExists(
    client,
    requestSql(),
    [buyerId, `Sourcing ${marker}`],
    "sourcing request",
  );
}

function quoteSql() {
  return `SELECT 1 FROM quote_requests
          WHERE buyer_user_id = $1 AND message = $2 AND offer_price_usd = 18000`;
}

function viewingSql() {
  return `SELECT 1 FROM viewing_appointments
          WHERE buyer_user_id = $1 AND note = $2 AND status = 'REQUESTED'`;
}

function requestSql() {
  return `SELECT 1 FROM vehicle_requests
          WHERE buyer_user_id = $1 AND notes = $2 AND max_budget_cents = 2500000`;
}

async function assertExists(client, sql, values, label) {
  const result = await client.query(sql, values);
  assert(result.rowCount > 0, `Persisted ${label} was not found`);
}

async function loadSellerListing(client, sellerId, context) {
  const result = await client.query(
    `SELECT v.id, v.status, v.seller_disclosure, s.year, s.make, s.model,
            p.ask_price_usd
     FROM vehicles v
     JOIN vehicle_specs s ON s.vehicle_id = v.id
     JOIN vehicle_pricing p ON p.vehicle_id = v.id
     WHERE v.seller_user_id = $1 AND s.model = $2`,
    [sellerId, `Web ${context.runId}`],
  );
  assert(
    result.rowCount === 1,
    "Seller listing was not persisted exactly once",
  );
  const listing = result.rows[0];
  assert(listing.status === "SUBMITTED", "Seller listing was not submitted");
  assert(listing.make === "E2E", "Seller listing make was not persisted");
  assert(
    Number(listing.ask_price_usd) === 21_000,
    "Seller ask price is incorrect",
  );
  assert(
    listing.seller_disclosure.includes(context.marker),
    "Seller disclosure is incorrect",
  );
  return listing;
}

async function loadListingMedia(client, listingId) {
  const images = await client.query(
    `SELECT storage_key, content_type, byte_size, is_cover
     FROM vehicle_images WHERE vehicle_id = $1 ORDER BY position`,
    [listingId],
  );
  const documents = await client.query(
    `SELECT storage_key, content_type, byte_size, document_type
     FROM vehicle_documents WHERE vehicle_id = $1 ORDER BY document_type`,
    [listingId],
  );
  assert(images.rowCount === 3, "Seller listing does not have three images");
  assert(
    images.rows.filter((image) => image.is_cover).length === 1,
    "Seller listing must have one cover image",
  );
  assert(
    documents.rowCount === 3,
    "Seller listing does not have three documents",
  );
  return { images: images.rows, documents: documents.rows };
}

async function assertInspection(client, inspectorId, context) {
  const report = await client.query(
    `SELECT r.id, r.overall_score, r.roadworthy, r.inspector_note, t.status
     FROM inspection_reports r
     JOIN inspection_tasks t ON t.id = r.task_id
     WHERE r.submitted_by_inspector_id = $1
       AND t.location_note = $2`,
    [inspectorId, `Mobile web E2E ${context.runId}`],
  );
  assert(report.rowCount === 1, "Inspector report was not persisted");
  assert(
    report.rows[0].status === "REPORT_SUBMITTED",
    "Inspection task status is incorrect",
  );
  assert(report.rows[0].overall_score === 87, "Inspection score is incorrect");
  assert(report.rows[0].roadworthy, "Inspection roadworthy value is incorrect");
  assert(
    report.rows[0].inspector_note === `Inspection complete ${context.marker}`,
    "Inspector summary is incorrect",
  );
  return assertFindings(client, report.rows[0].id, context.marker);
}

async function assertFindings(client, reportId, marker) {
  const result = await client.query(
    `SELECT category, rating, note, photo_storage_key
     FROM inspection_findings WHERE report_id = $1`,
    [reportId],
  );
  assert(result.rowCount === 6, "Inspection does not have six findings");
  assert(
    result.rows.filter((row) => row.rating === "PASS").length === 5,
    "Expected five passing findings",
  );
  const failure = result.rows.find((row) => row.category === "ENGINE");
  assert(failure?.rating === "FAIL", "Engine finding was not failed");
  assert(
    failure.note === `Engine evidence ${marker}`,
    "Engine note is incorrect",
  );
  assert(failure.photo_storage_key, "Engine evidence storage key is missing");
  return failure.photo_storage_key;
}

async function verifyStoredObjects(images, documents, evidenceKey) {
  for (const image of images) {
    const bytes = await download(image.storage_key);
    assert(
      bytes.length === image.byte_size,
      `Image size mismatch: ${image.storage_key}`,
    );
    assert(
      isImage(bytes),
      `Image magic bytes are invalid: ${image.storage_key}`,
    );
  }
  for (const document of documents) {
    const bytes = await download(document.storage_key);
    assert(
      bytes.length === document.byte_size,
      `Document size mismatch: ${document.storage_key}`,
    );
    assert(
      isPdf(bytes),
      `Document magic bytes are invalid: ${document.storage_key}`,
    );
  }
  assert(
    isImage(await download(evidenceKey)),
    "Inspection evidence magic bytes are invalid",
  );
}

async function download(key) {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  assert(response.Body, `Storage returned no body for ${key}`);
  return response.Body.transformToByteArray();
}

function isImage(bytes) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
  const webp = text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP";
  return jpeg || png || webp;
}

function isPdf(bytes) {
  return text(bytes, 0, 5) === "%PDF-";
}

function text(bytes, start, end) {
  return new TextDecoder().decode(bytes.slice(start, end));
}

async function withDatabase(action) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [
      tenantId,
    ]);
    return await action(client);
  } finally {
    await client.end();
  }
}

async function persistedRunId() {
  if (process.env.MOBILE_E2E_RUN_ID) return process.env.MOBILE_E2E_RUN_ID;
  return (await readFile("output/mobile-web-e2e/latest-run-id", "utf8")).trim();
}

function env(name, fallback) {
  return process.env[name] || fallback;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
