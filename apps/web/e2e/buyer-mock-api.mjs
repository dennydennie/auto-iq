import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 4500;
const now = "2026-08-10T08:00:00.000Z";
const toyotaId = "22222222-2222-4222-8222-222222222222";

function listing(input) {
  return {
    id: input.id,
    slug: input.slug,
    year: input.year,
    make: input.make,
    model: input.model,
    bodyType: input.bodyType,
    askPriceUsd: input.askPriceUsd,
    negotiable: true,
    city: input.city,
    coverImageUrl: null,
    bisellVerified: true,
    inspectionScore: 88,
    daysListed: 4,
  };
}

const listings = [
  listing({
    id: toyotaId,
    slug: "2021-toyota-hilux-harare",
    year: 2021,
    make: "Toyota",
    model: "Hilux",
    bodyType: "BAKKIE",
    askPriceUsd: 22000,
    city: "Harare",
  }),
  listing({
    id: "33333333-3333-4333-8333-333333333333",
    slug: "2020-honda-cr-v-bulawayo",
    year: 2020,
    make: "Honda",
    model: "CR-V",
    bodyType: "SUV",
    askPriceUsd: 18000,
    city: "Bulawayo",
  }),
];

function initialState() {
  return { saved: new Set(), quotes: [], requests: [], viewings: [], notifications: [] };
}

let state = initialState();

function me() {
  return {
    id: "buyer-1",
    fullName: "Buyer One",
    email: "buyer@example.test",
    phone: "+263771000001",
    status: "ACTIVE",
    roles: ["BUYER"],
    phoneVerified: true,
    emailVerified: true,
    buyerProfile: {
      id: "buyer-profile-1",
      city: "Harare",
      vehiclePurpose: "PERSONAL",
      searchRadiusKm: 100,
      deliveryPreference: "EITHER",
      paymentPreference: "CASH",
      preferredBodyTypes: ["BAKKIE"],
      preferredMakes: ["Toyota"],
      preferredFuelTypes: ["DIESEL"],
      preferredTransmissions: ["MANUAL"],
      minSeats: 5,
      maxMileageKm: 150000,
      yearMin: 2018,
      yearMax: 2025,
      budgetMin: 15000,
      budgetMax: 25000,
    },
    sellerProfile: null,
    createdAt: now,
    updatedAt: now,
  };
}

function detail(card) {
  return {
    ...card,
    colour: "White",
    fuelType: "DIESEL",
    transmission: "MANUAL",
    driveType: "4WD",
    engineCapacity: "2.8L",
    mileageKm: 98000,
    sellerDisclosure: "Full service history and no known mechanical faults.",
    images: [],
    inspectionSummary: inspectionSummary(card.id),
    publishedAt: now,
    viewCount: 17,
  };
}

function inspectionSummary(listingId) {
  return {
    listingId,
    inspectionDate: now,
    inspectorName: "Inspector One",
    overallScore: 88,
    roadworthy: true,
    categories: [],
    findings: [{ label: "Engine check", rating: "PASS", note: "Healthy" }],
    inspectorNote: "Roadworthy and ready for buyer review.",
  };
}

function referenceData() {
  return {
    makes: [
      { id: "toyota", name: "Toyota", logoUrl: null, popularModels: ["Hilux"] },
      { id: "honda", name: "Honda", logoUrl: null, popularModels: ["CR-V"] },
    ],
    bodyTypes: [{ value: "BAKKIE", label: "Bakkie" }],
    fuelTypes: [{ value: "DIESEL", label: "Diesel" }],
    transmissionTypes: [{ value: "MANUAL", label: "Manual" }],
    driveTypes: [{ value: "4WD", label: "4wd" }],
    conditionGrades: [{ value: "GOOD", label: "Good" }],
    viewingLocations: [viewingLocation()],
  };
}

function viewingLocation() {
  return {
    id: "location-1",
    name: "Borrowdale Hub",
    addressLine1: "1 Borrowdale Road",
    addressLine2: null,
    city: "Harare",
    coordinates: { lat: -17.75, lng: 31.1 },
    active: true,
  };
}

function createViewing(body) {
  const viewing = {
    id: `viewing-${state.viewings.length + 1}`,
    listingId: toyotaId,
    listingSnapshot: { year: 2021, make: "Toyota", model: "Hilux", coverImageUrl: null },
    status: "REQUESTED",
    buyerId: "buyer-1",
    buyerName: "Buyer One",
    preferredSlot: `${body.preferredDate}T${body.preferredTime}:00.000Z`,
    confirmedSlot: null,
    location: viewingLocation(),
    participants: [
      { userId: "buyer-1", name: "Buyer One", role: "BUYER", confirmed: true },
      { userId: "seller-1", name: "Seller One", role: "SELLER", confirmed: false },
    ],
    note: body.note?.trim() || null,
    outcomeNote: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  state.viewings.unshift(viewing);
  state.notifications.unshift(notification("VIEWING_REQUESTED", "FAILED"));
  return viewing;
}

function notification(template, status) {
  return {
    id: `notification-${state.notifications.length + 1}`,
    recipientId: "seller-1",
    recipientName: "Seller One",
    channel: "EMAIL",
    template,
    idempotencyKey: `viewing:${state.viewings.length}:${template}`,
    status,
    attemptCount: 1,
    lastAttemptAt: now,
    attempts: [],
    createdAt: now,
    updatedAt: now,
  };
}

function page(data, limit = 12) {
  return { data, meta: { page: 1, limit, total: data.length, totalPages: 1 } };
}

function catalogue(url) {
  const make = url.searchParams.get("make")?.toLowerCase();
  const model = url.searchParams.get("model")?.toLowerCase();
  const city = url.searchParams.get("city")?.toLowerCase();
  const data = listings.filter((entry) =>
    (!make || entry.make.toLowerCase() === make) &&
    (!model || entry.model.toLowerCase().includes(model)) &&
    (!city || entry.city.toLowerCase().includes(city)),
  );
  return { data, meta: { nextCursor: null, hasMore: false } };
}

function savedVehicles() {
  const data = listings
    .filter((entry) => state.saved.has(entry.id))
    .map((entry) => ({ id: `saved-${entry.id}`, listing: entry, savedAt: now }));
  return page(data, 20);
}

function createQuote(body) {
  const quote = {
    id: `quote-${state.quotes.length + 1}`,
    listingId: toyotaId,
    buyerId: "buyer-1",
    buyerName: "Buyer One",
    offerPriceUsd: Number(body.offerPriceUsd),
    askPriceUsd: 22000,
    paymentPlan: body.paymentPlan,
    message: body.message?.trim() || null,
    status: "NEW",
    counterPriceUsd: null,
    responseNote: null,
    respondedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  state.quotes.unshift(quote);
  return quote;
}

function createVehicleRequest(body) {
  const request = {
    id: `request-${state.requests.length + 1}`,
    buyerId: "buyer-1",
    buyerName: "Buyer One",
    buyerPhone: "+263771000001",
    ...body,
    makeName: body.makeId === "toyota" ? "Toyota" : undefined,
    status: "NEW",
    adminNote: undefined,
    matchedListingId: undefined,
    createdAt: now,
    updatedAt: now,
  };
  state.requests.unshift(request);
  return request;
}

function send(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "x-correlation-id": "buyer-e2e-correlation-id",
  });
  response.end(statusCode === 204 ? undefined : JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function apiError(message, statusCode = 404) {
  return {
    code: "RESOURCE_NOT_FOUND",
    message,
    correlationId: "buyer-e2e-correlation-id",
    statusCode,
  };
}

function findListing(pathname) {
  const key = decodeURIComponent(pathname.split("/").at(-1) ?? "");
  return listings.find((entry) => entry.id === key || entry.slug === key);
}

function handleRead(url, response) {
  if (url.pathname === "/api/v1/me") return send(response, 200, me());
  if (url.pathname === "/api/v1/reference-data") return send(response, 200, referenceData());
  if (url.pathname === "/api/v1/me/saved-vehicles") return send(response, 200, savedVehicles());
  if (url.pathname === "/api/v1/me/quotes") return send(response, 200, page(state.quotes));
  if (url.pathname === "/api/v1/admin/quotes") return send(response, 200, page(state.quotes));
  if (url.pathname === "/api/v1/me/vehicle-requests") return send(response, 200, page(state.requests));
  if (url.pathname === "/api/v1/me/viewings") return send(response, 200, page(state.viewings));
  if (url.pathname === "/api/v1/me/seller-viewings") return send(response, 200, page(state.viewings));
  if (url.pathname === "/api/v1/admin/viewings") return send(response, 200, page(state.viewings));
  if (url.pathname === "/api/v1/admin/notifications") return send(response, 200, page(state.notifications));
  if (url.pathname === "/api/v1/admin/vehicle-requests") return send(response, 200, page(state.requests));
  return false;
}

function handleCatalogue(url, response) {
  if (url.pathname === "/api/v1/listings/facets/makes") {
    return send(response, 200, [{ make: "Honda", count: 1 }, { make: "Toyota", count: 1 }]);
  }
  if (url.pathname === "/api/v1/listings/facets/models") {
    const make = url.searchParams.get("make") ?? "";
    const data = listings.filter((entry) => entry.make === make).map((entry) => ({
      make: entry.make,
      model: entry.model,
      count: 1,
    }));
    return send(response, 200, data);
  }
  if (url.pathname === "/api/v1/listings") return send(response, 200, catalogue(url));
  if (!url.pathname.startsWith("/api/v1/listings/")) return false;
  const found = findListing(url.pathname);
  return found ? send(response, 200, detail(found)) : false;
}

async function handleSaved(request, response, url) {
  const prefix = "/api/v1/me/saved-vehicles/";
  if (!url.pathname.startsWith(prefix)) return false;
  const listingId = url.pathname.slice(prefix.length);
  if (request.method === "POST") state.saved.add(listingId);
  if (request.method === "DELETE") state.saved.delete(listingId);
  send(response, request.method === "DELETE" ? 204 : 200, savedVehicles().data[0]);
  return true;
}

async function handleQuote(request, response, url) {
  const createPath = `/api/v1/listings/${toyotaId}/quotes`;
  if (request.method === "POST" && url.pathname === createPath) {
    send(response, 201, createQuote(await readBody(request)));
    return true;
  }
  const match = url.pathname.match(/^\/api\/v1\/admin\/quotes\/([^/]+)\/(review|accept|counter|decline)$/);
  if (!match || request.method !== "POST") return false;
  const quote = state.quotes.find((entry) => entry.id === match[1]);
  if (!quote) return false;
  const body = await readBody(request);
  quote.status = { review: "UNDER_REVIEW", accept: "ACCEPTED", counter: "COUNTERED", decline: "DECLINED" }[match[2]];
  quote.responseNote = body.responseNote?.trim() || null;
  quote.updatedAt = now;
  send(response, 200, quote);
  return true;
}

async function handleVehicleRequest(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/v1/vehicle-requests") {
    send(response, 201, createVehicleRequest(await readBody(request)));
    return true;
  }
  const match = url.pathname.match(/^\/api\/v1\/admin\/vehicle-requests\/([^/]+)$/);
  if (!match || request.method !== "PATCH") return false;
  const vehicleRequest = state.requests.find((entry) => entry.id === match[1]);
  if (!vehicleRequest) return false;
  Object.assign(vehicleRequest, await readBody(request), { updatedAt: now });
  send(response, 200, vehicleRequest);
  return true;
}

async function handleViewing(request, response, url) {
  if (request.method === "POST" && url.pathname === `/api/v1/listings/${toyotaId}/viewings`) {
    send(response, 201, createViewing(await readBody(request)));
    return true;
  }
  const sellerMatch = url.pathname.match(/^\/api\/v1\/me\/viewings\/([^/]+)\/seller-confirm$/);
  if (request.method === "POST" && sellerMatch) {
    const viewing = state.viewings.find((entry) => entry.id === sellerMatch[1]);
    if (!viewing) return false;
    viewing.status = "PENDING_SELLER_CONFIRMATION";
    viewing.participants[1].confirmed = true;
    send(response, 200, viewing);
    return true;
  }
  const adminMatch = url.pathname.match(/^\/api\/v1\/admin\/viewings\/([^/]+)(?:\/(confirm|complete))?$/);
  if (!adminMatch) return false;
  const viewing = state.viewings.find((entry) => entry.id === adminMatch[1]);
  if (!viewing) return false;
  if (request.method === "GET") return send(response, 200, viewing), true;
  const body = await readBody(request);
  if (adminMatch[2] === "confirm") {
    viewing.status = "CONFIRMED";
    viewing.confirmedSlot = body.confirmedAt;
    state.notifications.unshift(notification("VIEWING_CONFIRMED", "SENT"));
  }
  if (adminMatch[2] === "complete") {
    viewing.status = body.outcome;
    viewing.outcomeNote = body.note || null;
    viewing.completedAt = now;
  }
  send(response, 200, viewing);
  return true;
}

async function handleNotification(request, response, url) {
  const match = url.pathname.match(/^\/api\/v1\/admin\/notifications\/([^/]+)\/retry$/);
  if (request.method !== "POST" || !match) return false;
  const item = state.notifications.find((entry) => entry.id === match[1]);
  if (!item) return false;
  item.status = "QUEUED";
  item.attemptCount += 1;
  send(response, 200, item);
  return true;
}

async function handle(request, response) {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (url.pathname === "/health") return send(response, 200, { ok: true });
  if (url.pathname === "/__reset") {
    state = initialState();
    return send(response, 204);
  }
  if (url.pathname === "/api/v1/auth/csrf") return send(response, 200, { token: "buyer-e2e-csrf" });
  if (request.method === "GET" && handleRead(url, response) !== false) return;
  if (request.method === "GET" && handleCatalogue(url, response) !== false) return;
  if (await handleSaved(request, response, url)) return;
  if (await handleQuote(request, response, url)) return;
  if (await handleVehicleRequest(request, response, url)) return;
  if (await handleViewing(request, response, url)) return;
  if (await handleNotification(request, response, url)) return;
  return send(response, 404, apiError("Not found"));
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    send(response, 500, apiError(error instanceof Error ? error.message : "Mock failure", 500));
  });
});

server.listen(port, host, () => {
  console.log(`Buyer mock API listening on http://${host}:${port}`);
});

process.on("SIGTERM", () => server.close());
