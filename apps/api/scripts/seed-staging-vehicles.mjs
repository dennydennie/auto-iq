import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const apiBase = process.env.API_BASE ?? 'http://api:4000/api/v1';
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://auto_iq:auto_iq_dev@postgres:5432/auto_iq';
const password = process.env.PASSWORD ?? generatedPassword();
const runId = process.env.RUN_ID ?? `${Date.now()}`;

const sellerEmail = `staging-seller-${runId}@example.com`;
const sellerPhone = `+26377${runId.slice(-4)}4111`;
const adminEmail = `staging-admin-${runId}@example.com`;
const adminPhone = `+26377${runId.slice(-4)}4222`;
const inspectorEmail = `staging-inspector-${runId}@example.com`;
const inspectorPhone = `+26377${runId.slice(-4)}4333`;

const client = new Client({ connectionString: databaseUrl });
const pdfBytes = new TextEncoder().encode(
  '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n',
);

function generatedPassword() {
  return `AutoIQ!${randomBytes(6).toString('base64url')}9`;
}

const VEHICLES = [
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
    sellerDisclosure: 'Clean workhorse with complete service history.',
    inspectionLocation: 'Borrowdale, Harare',
    image: {
      sourcePage:
        'https://commons.wikimedia.org/wiki/File:Toyota_Hilux_(facelift)_front.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Toyota_Hilux_%28facelift%29_front.jpg',
    },
    findings: [
      {
        category: 'ENGINE',
        label: 'Cold start',
        rating: 'PASS',
        note: 'Starts cleanly with no smoke.',
      },
      {
        category: 'BODY',
        label: 'Load bed wear',
        rating: 'WATCH',
        note: 'Minor cosmetic wear consistent with age.',
      },
    ],
  },
  {
    make: 'Honda',
    model: 'CR-V',
    year: 2019,
    bodyType: 'SUV',
    colour: 'Silver',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    driveType: 'FWD',
    engineCapacity: '2.4L',
    mileageKm: 78000,
    condition: 'GOOD',
    hasAccidentHistory: false,
    askPriceUsd: 16800,
    negotiable: true,
    sellerDisclosure: 'Family SUV with tidy interior and light urban mileage.',
    inspectionLocation: 'Avondale, Harare',
    image: {
      sourcePage:
        'https://commons.wikimedia.org/wiki/File:2017_Honda_CR-V_front_4.11.18.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/2017_Honda_CR-V_front_4.11.18.jpg',
    },
    findings: [
      {
        category: 'INTERIOR',
        label: 'Cabin condition',
        rating: 'PASS',
        note: 'Seats and trim are well kept.',
      },
      {
        category: 'TYRES',
        label: 'Tread depth',
        rating: 'WATCH',
        note: 'Front tyres will need replacement soon.',
      },
    ],
  },
  {
    make: 'Mazda',
    model: 'CX-5',
    year: 2022,
    bodyType: 'SUV',
    colour: 'Red',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    driveType: 'AWD',
    engineCapacity: '2.5L',
    mileageKm: 54000,
    condition: 'EXCELLENT',
    hasAccidentHistory: false,
    askPriceUsd: 22900,
    negotiable: false,
    sellerDisclosure: 'Well-kept crossover with strong service records and recent tyres.',
    inspectionLocation: 'Mount Pleasant, Harare',
    image: {
      sourcePage:
        'https://commons.wikimedia.org/wiki/File:Mazda_CX-5_(front_side_quarter).jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Mazda_CX-5_%28front_side_quarter%29.jpg',
    },
    findings: [
      {
        category: 'BRAKES',
        label: 'Brake feel',
        rating: 'PASS',
        note: 'Pedal feel is firm and consistent.',
      },
      {
        category: 'ELECTRICAL',
        label: 'Infotainment',
        rating: 'PASS',
        note: 'Screen and cameras function correctly.',
      },
    ],
  },
];

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function registerSeller() {
  await request('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Staging Vehicle Seller',
      email: sellerEmail,
      phone: sellerPhone,
      password,
      role: 'SELLER',
      city: 'Harare',
    },
  });
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

async function createSubmittedListing(session, vehicle) {
  const listing = await session.post('/listings', {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    bodyType: vehicle.bodyType,
    colour: vehicle.colour,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    driveType: vehicle.driveType,
    engineCapacity: vehicle.engineCapacity,
    mileageKm: vehicle.mileageKm,
    condition: vehicle.condition,
    hasAccidentHistory: vehicle.hasAccidentHistory,
    askPriceUsd: vehicle.askPriceUsd,
    negotiable: vehicle.negotiable,
  }, { csrf: true });

  const image = await downloadImage(vehicle.image.url);
  const imagePresign = await session.post('/storage/images/presign', {
    slot: 'FRONT_THREE_QUARTER',
    contentType: image.contentType,
    contentLength: image.bytes.length,
  }, { csrf: true });
  await rawUpload(imagePresign.uploadUrl, image.bytes, image.contentType);
  await session.post(`/listings/${listing.id}/images`, {
    storageKey: imagePresign.storageKey,
    slot: 'FRONT_THREE_QUARTER',
    isCover: true,
  }, { csrf: true });

  const documentPresign = await session.post('/storage/documents/presign', {
    documentType: 'REGISTRATION_BOOK',
    contentType: 'application/pdf',
    contentLength: pdfBytes.length,
  }, { csrf: true });
  await rawUpload(documentPresign.uploadUrl, pdfBytes, 'application/pdf');
  await session.post(`/listings/${listing.id}/documents`, {
    storageKey: documentPresign.storageKey,
    documentType: 'REGISTRATION_BOOK',
  }, { csrf: true });

  await session.post(`/listings/${listing.id}/submit`, {
    sellerDisclosure: vehicle.sellerDisclosure,
  }, { csrf: true });

  return {
    id: listing.id,
    sourcePage: vehicle.image.sourcePage,
    downloadedFrom: image.url,
  };
}

async function publishListing(adminSession, inspectorSession, inspectorId, listingId, vehicleIndex, vehicle) {
  await adminSession.post(`/admin/listings/${listingId}/ownership-verification`, {
    status: 'IN_REVIEW',
    note: `Ownership review opened for ${vehicle.make} ${vehicle.model}.`,
  }, { csrf: true });

  const inspectionTask = await adminSession.post(
    `/admin/listings/${listingId}/inspection-tasks`,
    {
      inspectorId,
      scheduledAt: inspectionDate(vehicleIndex),
      locationNote: vehicle.inspectionLocation,
    },
    { csrf: true },
  );

  await inspectorSession.post(
    `/inspectors/inspection-tasks/${inspectionTask.id}/report`,
    {
      findings: vehicle.findings,
      inspectorNote: `${vehicle.make} ${vehicle.model} inspected and suitable for staging marketplace demo.`,
      roadworthy: true,
    },
    { csrf: true },
  );

  await adminSession.post(`/admin/listings/${listingId}/ownership-verification`, {
    status: 'APPROVED',
    note: 'Ownership verified.',
  }, { csrf: true });
  await adminSession.post(
    `/admin/listings/${listingId}/inspection-summary/approve`,
    { buyerNote: 'Independent inspection complete.' },
    { csrf: true },
  );
  await adminSession.post(`/admin/listings/${listingId}/approve`, {}, { csrf: true });
  await adminSession.post(`/admin/listings/${listingId}/publish`, {}, { csrf: true });
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent': 'AutoIQ staging seed/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} for ${url}`);
  }
  const contentType = response.headers.get('content-type')?.split(';', 1)[0] ?? '';
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    throw new Error(`Unsupported image type ${contentType} for ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, contentType, url: response.url };
}

function inspectionDate(index) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + index + 1);
  date.setUTCHours(9 + index, 0, 0, 0);
  return date.toISOString();
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
    fullName: 'Staging Vehicle Admin',
    city: 'Harare',
    role: 'ADMIN',
  });
  const inspectorId = await insertUser({
    email: inspectorEmail,
    phone: inspectorPhone,
    fullName: 'Staging Vehicle Inspector',
    city: 'Harare',
    role: 'INSPECTOR',
  });

  const sellerSession = await registerSeller();
  const adminSession = await login(adminEmail);
  const inspectorSession = await login(inspectorEmail);
  const listings = [];

  for (const [index, vehicle] of VEHICLES.entries()) {
    const listing = await createSubmittedListing(sellerSession, vehicle);
    await publishListing(
      adminSession,
      inspectorSession,
      inspectorId,
      listing.id,
      index,
      vehicle,
    );
    listings.push({
      id: listing.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      sourcePage: listing.sourcePage,
      downloadedFrom: listing.downloadedFrom,
    });
  }

  await client.end();
  console.log(JSON.stringify({
    password,
    users: {
      seller: sellerEmail,
      admin: adminEmail,
      adminId,
      inspector: inspectorEmail,
    },
    listings,
  }));
}
