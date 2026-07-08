import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const apiBase = process.env.API_BASE ?? 'http://api:4000/api/v1';
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://auto_iq:auto_iq_dev@postgres:5432/auto_iq';
const password = process.env.PASSWORD ?? generatedPassword();
const runId = process.env.RUN_ID ?? `${Date.now()}`;

const sellerEmail = `mobile-seller-${runId}@example.com`;
const sellerPhone = `+26377${runId.slice(-4)}1111`;
const adminEmail = `mobile-admin-${runId}@example.com`;
const adminPhone = `+26377${runId.slice(-4)}2222`;
const inspectorEmail = `mobile-inspector-${runId}@example.com`;
const inspectorPhone = `+26377${runId.slice(-4)}3333`;

const client = new Client({ connectionString: databaseUrl });

function generatedPassword() {
  return `AutoIQ!${randomBytes(6).toString('base64url')}9`;
}

async function registerSeller() {
  await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Mobile Demo Seller',
      email: sellerEmail,
      phone: sellerPhone,
      password,
      role: 'SELLER',
      city: 'Harare',
    },
  });
  await markUserVerified(sellerEmail);
  const sellerSession = await login(sellerEmail);
  for (const consent of ['TERMS', 'PRIVACY', 'SELLER_RULES', 'NO_SIDE_DEAL']) {
    await sellerSession.post(
      '/me/consents',
      { consentType: consent, version: '1.0.0', accepted: true },
      { csrf: true },
    );
  }
  return sellerSession;
}

async function markUserVerified(email) {
  await client.query(
    "UPDATE users SET status = 'ACTIVE', phone_verified = true, email_verified = true WHERE email = $1",
    [email],
  );
}

async function createSubmittedListing(session) {
  const listing = await session.post(
    '/listings',
    {
      make: 'Toyota',
      model: 'Hilux',
      year: 2021,
      bodyType: 'BAKKIE',
      colour: 'White',
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      driveType: '4WD',
      engineCapacity: '2.8L',
      mileageKm: 123000,
      condition: 'GOOD',
      hasAccidentHistory: false,
      askPriceUsd: 19500,
      negotiable: true,
    },
    { csrf: true },
  );

  const imageBytes = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9,
  ]);
  for (const [index, slot] of ['FRONT_THREE_QUARTER', 'DRIVER_SIDE', 'INTERIOR_FRONT'].entries()) {
    await uploadListingImage(session, listing.id, imageBytes, slot, index === 0);
  }

  const pdfBytes = new TextEncoder().encode(
    '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n',
  );
  const documentPresign = await session.post(
    '/storage/documents/presign',
    {
      documentType: 'REGISTRATION_BOOK',
      contentType: 'application/pdf',
      contentLength: pdfBytes.length,
    },
    { csrf: true },
  );
  await rawUpload(documentPresign.uploadUrl, pdfBytes, 'application/pdf');
  await session.post(
    `/listings/${listing.id}/documents`,
    {
      storageKey: documentPresign.storageKey,
      documentType: 'REGISTRATION_BOOK',
    },
    { csrf: true },
  );
  await session.post(
    `/listings/${listing.id}/submit`,
    { sellerDisclosure: 'Prepared for the Auto IQ Android demo runtime.' },
    { csrf: true },
  );
  return listing.id;
}

async function uploadListingImage(session, listingId, imageBytes, slot, isCover) {
  const presign = await session.post(
    '/storage/images/presign',
    { slot, contentType: 'image/jpeg', contentLength: imageBytes.length },
    { csrf: true },
  );
  await rawUpload(presign.uploadUrl, imageBytes, 'image/jpeg');
  await session.post(
    `/listings/${listingId}/images`,
    { storageKey: presign.storageKey, slot, isCover },
    { csrf: true },
  );
}

async function insertUser({ email, phone, fullName, city, role }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await client.query(
    `
      INSERT INTO users (full_name, email, phone, password_hash, status, city, phone_verified, email_verified)
      VALUES ($1, $2, $3, $4, 'ACTIVE', $5, true, true)
      RETURNING id
    `,
    [fullName, email, phone, hash, city],
  );
  const userId = result.rows[0].id;
  await client.query(
    'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
    [userId, role],
  );
  return userId;
}

async function rawUpload(url, bytes, contentType) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': `${bytes.length}`,
    },
    body: bytes,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}

async function login(email) {
  const session = new ApiSession(apiBase);
  await session.post('/auth/login', {
    identifier: email,
    password,
  });
  await session.csrf();
  return session;
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

class ApiSession {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
    this.csrfToken = null;
  }

  async csrf() {
    const response = await this._fetch('/auth/csrf');
    const payload = await response.json();
    this.csrfToken = payload.token;
    return this.csrfToken;
  }

  async post(path, body, options = {}) {
    const response = await this._fetch(path, {
      method: 'POST',
      headers: options.csrf && this.csrfToken
        ? { 'X-CSRF-Token': this.csrfToken }
        : undefined,
      body,
    });
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  async _fetch(path, { method = 'GET', headers, body } = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: this._cookieHeader(),
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    this._captureCookies(response);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Session request failed ${response.status}: ${text}`);
    }
    return response;
  }

  _captureCookies(response) {
    const setCookieHeader = response.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookieHeader) {
      const pair = cookie.split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator < 0) {
        continue;
      }
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      this.cookies.set(name, value);
    }
  }

  _cookieHeader() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

await run();

async function run() {
  await client.connect();

  const adminId = await insertUser({
    email: adminEmail,
    phone: adminPhone,
    fullName: 'Mobile Demo Admin',
    city: 'Harare',
    role: 'ADMIN',
  });
  const inspectorId = await insertUser({
    email: inspectorEmail,
    phone: inspectorPhone,
    fullName: 'Mobile Demo Inspector',
    city: 'Harare',
    role: 'INSPECTOR',
  });

  const sellerCsrf = await registerSeller();
  const adminSession = await login(adminEmail);
  const inspectorSession = await login(inspectorEmail);
  const listingId = await createSubmittedListing(sellerCsrf);

  await adminSession.post(
    `/admin/listings/${listingId}/ownership-verification`,
    {
      status: 'IN_REVIEW',
      note: 'Initial ownership review.',
    },
    { csrf: true },
  );

  const inspectionTask = await adminSession.post(
    `/admin/listings/${listingId}/inspection-tasks`,
    {
      inspectorId,
      scheduledAt: '2026-06-20T09:00:00.000Z',
      locationNote: 'Auto IQ mobile demo',
    },
    { csrf: true },
  );

  await inspectorSession.post(
    `/inspectors/inspection-tasks/${inspectionTask.id}/report`,
    {
      findings: [
        {
          category: 'ENGINE',
          label: 'Oil level',
          rating: 'PASS',
          note: 'Within range',
        },
        {
          category: 'ELECTRICAL',
          label: 'Air conditioning',
          rating: 'WATCH',
          note: 'Cooling weaker than expected',
        },
      ],
      inspectorNote: 'Vehicle is in good condition overall.',
      roadworthy: true,
    },
    { csrf: true },
  );

  await adminSession.post(
    `/admin/listings/${listingId}/ownership-verification`,
    {
      status: 'APPROVED',
      note: 'Ownership verified.',
    },
    { csrf: true },
  );
  await adminSession.post(
    `/admin/listings/${listingId}/inspection-summary/approve`,
    { buyerNote: 'Independent inspection complete.' },
    { csrf: true },
  );
  await adminSession.post(`/admin/listings/${listingId}/approve`, {}, { csrf: true });
  await adminSession.post(`/admin/listings/${listingId}/publish`, {}, { csrf: true });

  await client.end();
  console.log(JSON.stringify({
    listingId,
    password,
    users: {
      seller: sellerEmail,
      admin: adminEmail,
      inspector: inspectorEmail,
    },
  }));
}
