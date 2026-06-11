const API_BASE = process.env.API_BASE ?? "http://localhost:4000/api/v1";
const SELLER_EMAIL = process.env.SELLER_EMAIL;
const SELLER_PASSWORD = process.env.SELLER_PASSWORD;
let listingId = process.env.LISTING_ID ?? "";
const REQUESTS = Number(process.env.REQUESTS ?? 20);
const VUS = Number(process.env.VUS ?? 5);
const SLOTS = [
  "FRONT_THREE_QUARTER",
  "REAR_THREE_QUARTER",
  "DRIVER_SIDE",
  "PASSENGER_SIDE",
  "INTERIOR_FRONT",
  "INTERIOR_REAR",
  "DASHBOARD",
  "ENGINE_BAY",
  "BOOT",
  "FRONT_LEFT_WHEEL",
  "ODOMETER",
  "VIN_PLATE",
];

if (!SELLER_EMAIL || !SELLER_PASSWORD) {
  throw new Error("Set SELLER_EMAIL and SELLER_PASSWORD before running presign-register smoke.");
}

const imageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const jar = new Map();
let uploadIndex = 0;

await login();
const csrfToken = await fetchCsrf();
listingId ||= await createDraftListing(csrfToken);
await uploadAndRegister("FRONT_THREE_QUARTER", true, csrfToken);

const results = [];
let errors = 0;

await runPool(VUS, REQUESTS, async () => {
  const startedAt = performance.now();
  const slot = nextSlot();
  try {
    await uploadAndRegister(slot, false, csrfToken);
  } catch {
    errors += 1;
  }
  results.push(performance.now() - startedAt);
});

report("presign-register", results, errors);

async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ identifier: SELLER_EMAIL, password: SELLER_PASSWORD }),
  });
  storeCookies(response);
}

async function createDraftListing(csrfToken) {
  const response = await fetchJson(`${API_BASE}/listings`, {
    method: "POST",
    headers: headers(csrfToken),
    body: JSON.stringify({
      make: "Toyota",
      model: "Hilux",
      year: 2022,
      bodyType: "BAKKIE",
      colour: "White",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      driveType: "4WD",
      engineCapacity: "2.8L",
      mileageKm: 110000,
      condition: "GOOD",
      hasAccidentHistory: false,
      askPriceUsd: 21000,
      negotiable: true,
    }),
  });
  return response.id;
}

async function uploadAndRegister(slot, isCover, csrfToken) {
  const presign = await fetchJson(`${API_BASE}/storage/images/presign`, {
    method: "POST",
    headers: headers(csrfToken),
    body: JSON.stringify({
      slot,
      contentType: "image/jpeg",
      contentLength: imageBytes.length,
    }),
  });

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: imageBytes,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }

  const response = await fetch(`${API_BASE}/listings/${listingId}/images`, {
    method: "POST",
    headers: headers(csrfToken),
    body: JSON.stringify({
      storageKey: presign.storageKey,
      slot,
      isCover,
    }),
  });
  if (!response.ok) {
    throw new Error(`Register failed: ${response.status}`);
  }
  await response.arrayBuffer();
}

async function fetchCsrf() {
  const response = await fetch(`${API_BASE}/auth/csrf`, {
    headers: cookieHeaders(),
  });
  storeCookies(response);
  const body = await response.json();
  return body.token;
}

function headers(csrfToken) {
  return {
    ...cookieHeaders(),
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-CSRF-Token": csrfToken,
  };
}

function cookieHeaders() {
  const cookie = [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  return cookie ? { Cookie: cookie } : {};
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  storeCookies(response);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

const originalFetch = global.fetch;
global.fetch = async (url, init = {}) => {
  const response = await originalFetch(url, init);
  storeCookies(response);
  return response;
};

function storeCookies(response) {
  const setCookie = response.headers.getSetCookie?.() ?? [];
  for (const entry of setCookie) {
    const [pair] = entry.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0) {
      jar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

async function runPool(concurrency, total, job) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < total) {
      index += 1;
      await job();
    }
  });
  await Promise.all(workers);
}

function report(label, durations, errors) {
  const sorted = [...durations].sort((left, right) => left - right);
  console.log(JSON.stringify({
    label,
    totalRequests: sorted.length,
    errors,
    averageMs: round(mean(sorted)),
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
  }, null, 2));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function percentile(sorted, target) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function nextSlot() {
  const slot = SLOTS[(uploadIndex % (SLOTS.length - 1)) + 1];
  uploadIndex += 1;
  return slot;
}
