import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 4400;
const now = "2026-08-10T08:00:00.000Z";

function initialListing() {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "2021-toyota-hilux-admin-review",
    status: "SUBMITTED",
    specs: {
      make: "Toyota",
      model: "Hilux",
      year: 2021,
      bodyType: "BAKKIE",
      colour: "White",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      driveType: "4WD",
      engineCapacity: "2.8L",
      mileageKm: 120000,
      condition: "GOOD",
      hasAccidentHistory: false,
      accidentNote: null,
    },
    pricing: { askPriceUsd: 22000, negotiable: true, currency: "USD" },
    images: [
      image("FRONT_THREE_QUARTER", true),
      image("DRIVER_SIDE", false),
      image("INTERIOR_FRONT", false),
    ],
    documents: [
      document("REGISTRATION_BOOK"),
      document("SELLER_ID"),
      document("PURCHASE_IMPORT_DOCS"),
    ],
    sellerDisclosure: "Full service history with no known mechanical issues.",
    viewCount: 0,
    viewingCount: 0,
    quoteCount: 0,
    changesNote: null,
    submittedAt: now,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    ownershipVerification: verification("IN_REVIEW"),
    inspectionTask: inspectionTask(),
    inspectionReport: inspectionReport(false),
  };
}

function image(slot, isCover) {
  return {
    id: `image-${slot}`,
    slot,
    url: `http://${host}:${port}/fixture.svg`,
    isCover,
    uploadedAt: now,
  };
}

function document(documentType) {
  return {
    id: `document-${documentType}`,
    documentType,
    downloadUrl: `http://${host}:${port}/document.pdf`,
    uploadedAt: now,
    reviewStatus: "PENDING",
  };
}

function verification(status) {
  return {
    id: "verification-1",
    listingId: "11111111-1111-4111-8111-111111111111",
    status,
    reviewedAt: now,
    reviewerAdminId: "admin-1",
    note: null,
    createdAt: now,
    updatedAt: now,
  };
}

function inspectionTask(status = "REPORT_SUBMITTED") {
  return {
    id: "task-1",
    listingId: "11111111-1111-4111-8111-111111111111",
    listingSnapshot: {
      year: 2021,
      make: "Toyota",
      model: "Hilux",
      coverImageUrl: null,
      city: "Harare",
    },
    status,
    assignedInspectorId: "inspector-1",
    assignedInspectorName: "Inspector One",
    scheduledAt: now,
    completedAt: status === "SCHEDULED" ? null : now,
    createdAt: now,
    updatedAt: now,
  };
}

function inspectionReport(buyerSummaryApproved, findings = defaultFindings()) {
  return {
    id: "report-1",
    taskId: "task-1",
    listingId: "11111111-1111-4111-8111-111111111111",
    submittedByInspectorId: "inspector-1",
    submittedByInspectorName: "Inspector One",
    overallScore: 86,
    roadworthy: true,
    inspectorNote: "Roadworthy and ready for buyer review.",
    findings,
    buyerSummaryApproved,
    buyerSummaryApprovedAt: buyerSummaryApproved ? now : null,
    buyerSummaryApprovedByAdminId: buyerSummaryApproved ? "admin-1" : null,
    createdAt: now,
    updatedAt: now,
  };
}

function defaultFindings() {
  return ["ENGINE", "ELECTRICAL", "BODY", "TYRES", "BRAKES", "INTERIOR"].map(
    (category, index) => ({
      id: `finding-${index + 1}`,
      category,
      label: `${category.toLowerCase()} check`,
      rating: "PASS",
      note: "Checked",
      photoUrl: null,
    }),
  );
}

let listing = initialListing();
let adminUsers = initialAdminUsers();
let referenceOptions = initialReferenceOptions();

function initialAdminUsers() {
  return [{
    id: "buyer-1", fullName: "Buyer One", email: "buyer@example.test", phone: "+263771000001",
    city: "Harare", role: "BUYER", accountStatus: "ACTIVE", accessActive: true,
    emailVerified: true, phoneVerified: true, createdAt: now,
  }];
}

function initialReferenceOptions() {
  return [
    ["option-body", "BODY_TYPE", "SUV", "SUV"],
    ["option-fuel", "FUEL_TYPE", "PETROL", "Petrol"],
    ["option-transmission", "TRANSMISSION_TYPE", "AUTOMATIC", "Automatic"],
    ["option-drive", "DRIVE_TYPE", "FWD", "Front-wheel drive"],
    ["option-condition", "CONDITION_GRADE", "GOOD", "Good"],
  ].map(([id, category, code, label], sortOrder) => ({ id, category, code, label, sortOrder, active: true, createdAt: now, updatedAt: now }));
}

function adminLocation() {
  return { id: "location-1", name: "Borrowdale Hub", addressLine1: "1 Borrowdale Road", addressLine2: null, city: "Harare", latitude: -17.75, longitude: 31.1, active: true, createdAt: now, updatedAt: now };
}

function send(response, statusCode, payload, contentType = "application/json") {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "x-correlation-id": "e2e-correlation-id",
  });
  response.end(
    contentType === "application/json" ? JSON.stringify(payload) : payload,
  );
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function dashboard() {
  return {
    queues: {
      pendingReview: listing.status === "SUBMITTED" ? 1 : 0,
      changesRequested: listing.status === "CHANGES_REQUESTED" ? 1 : 0,
      inspectionPending: 0,
      ownershipPending:
        listing.ownershipVerification.status === "APPROVED" ? 0 : 1,
      readyToPublish: listing.status === "APPROVED" ? 1 : 0,
    },
    viewingsTodayCount: 0,
    openQuoteCount: 0,
    openVehicleRequestCount: 0,
    recentActivityCount: 0,
  };
}

function apiError(message, statusCode = 409) {
  return {
    code: "VALIDATION_FAILED",
    message,
    correlationId: "e2e-correlation-id",
    statusCode,
  };
}

function trustGatesReady() {
  return (
    listing.ownershipVerification.status === "APPROVED" &&
    listing.inspectionReport?.buyerSummaryApproved
  );
}

function updateAction(pathname, body) {
  if (pathname.endsWith("/inspection-tasks")) {
    listing.status = "INSPECTION_PENDING";
    listing.inspectionTask = inspectionTask("SCHEDULED");
    listing.inspectionReport = null;
  } else if (pathname.endsWith("/ownership-verification")) {
    listing.ownershipVerification = verification(body.status);
  } else if (pathname.endsWith("/inspection-summary/approve")) {
    listing.inspectionReport = inspectionReport(
      true,
      listing.inspectionReport?.findings,
    );
    listing.inspectionTask = inspectionTask("BUYER_SUMMARY_APPROVED");
  } else if (pathname.endsWith("/request-changes")) {
    listing.status = "CHANGES_REQUESTED";
    listing.changesNote = body.message;
  } else if (pathname.endsWith("/approve") && trustGatesReady()) {
    listing.status = "APPROVED";
  } else if (pathname.endsWith("/publish") && trustGatesReady()) {
    listing.status = "PUBLISHED";
    listing.publishedAt = now;
  } else {
    return false;
  }
  return true;
}

function submitInspectionReport(body) {
  const findings = body.findings.map((finding, index) => ({
    id: `finding-${index + 1}`,
    ...finding,
    note: finding.note || null,
    photoUrl: null,
  }));
  listing.inspectionTask = inspectionTask("REPORT_SUBMITTED");
  listing.inspectionReport = {
    ...inspectionReport(false, findings),
    overallScore: 94,
    inspectorNote: body.inspectorNote,
    roadworthy: body.roadworthy,
  };
  return listing.inspectionReport;
}

async function handle(request, response) {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (url.pathname === "/health") return send(response, 200, { ok: true });
  if (url.pathname === "/__reset") {
    listing = initialListing();
    adminUsers = initialAdminUsers();
    referenceOptions = initialReferenceOptions();
    return send(response, 204, "");
  }
  if (url.pathname === "/__inspection-reset") {
    listing = initialListing();
    listing.status = "SUBMITTED";
    listing.inspectionTask = null;
    listing.inspectionReport = null;
    return send(response, 204, "");
  }
  if (url.pathname === "/__action") {
    const payload = await readBody(request);
    const suffix =
      payload.action === "inspection-summary-approve"
        ? "/inspection-summary/approve"
        : `/${payload.action}`;
    const updated = updateAction(suffix, payload.body ?? {});
    return updated
      ? send(response, 200, listing)
      : send(response, 409, apiError("Trust gates are incomplete"));
  }
  if (url.pathname === "/fixture.svg") {
    return send(
      response,
      200,
      "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'/>",
      "image/svg+xml",
    );
  }
  if (url.pathname === "/document.pdf")
    return send(response, 200, "%PDF-1.4", "application/pdf");
  if (url.pathname === "/api/v1/auth/csrf")
    return send(response, 200, { token: "e2e-csrf-token" });
  if (url.pathname === "/api/v1/admin/dashboard")
    return send(response, 200, dashboard());
  if (url.pathname === "/api/v1/admin/users" && request.method === "GET")
    return send(response, 200, { data: adminUsers, meta: { page: 1, limit: 20, total: adminUsers.length, totalPages: 1 } });
  const userAccessMatch = url.pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)\/access$/);
  if (userAccessMatch && request.method === "PATCH") {
    const user = adminUsers.find((entry) => entry.id === userAccessMatch[1]);
    if (!user) return send(response, 404, apiError("User not found", 404));
    user.accessActive = Boolean((await readBody(request)).active);
    return send(response, 200, user);
  }
  if (url.pathname === "/api/v1/admin/reports/operations") {
    return send(response, 200, {
      generatedAt: now, range: { from: "2026-08-01T00:00:00.000Z", to: now },
      users: { total: 8, active: 7, suspended: 1, verified: 6 },
      listings: { created: 12, submitted: 9, published: 7, sold: 2 },
      viewings: { requested: 5, confirmed: 4, completed: 3, cancelled: 1 },
      notifications: { queued: 1, sent: 20, failed: 1, deadLetter: 0, retryAttempts: 2 },
    });
  }
  if (url.pathname === "/api/v1/admin/settings/reference-options") {
    if (request.method === "GET") return send(response, 200, { data: referenceOptions, meta: { page: 1, limit: 100, total: referenceOptions.length, totalPages: 1 } });
    const body = await readBody(request);
    const option = { id: `option-${referenceOptions.length + 1}`, ...body, active: true, createdAt: now, updatedAt: now };
    referenceOptions.push(option);
    return send(response, 201, option);
  }
  if (url.pathname === "/api/v1/admin/settings/viewing-locations") {
    return send(response, 200, { data: [adminLocation()], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } });
  }
  if (url.pathname === "/api/v1/admin/viewings") {
    return send(response, 200, {
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });
  }
  if (url.pathname === "/api/v1/admin/inspectors") {
    return send(response, 200, [
      { id: "inspector-1", fullName: "Inspector One", city: "Harare" },
    ]);
  }
  if (url.pathname === "/api/v1/admin/inspection-tasks") {
    const tasks = listing.inspectionTask ? [listing.inspectionTask] : [];
    return send(response, 200, {
      data: tasks,
      meta: { page: 1, limit: 12, total: tasks.length, totalPages: 1 },
    });
  }
  if (
    listing.inspectionTask &&
    url.pathname === `/api/v1/admin/inspection-tasks/${listing.inspectionTask.id}`
  ) {
    return send(response, 200, {
      task: listing.inspectionTask,
      report: listing.inspectionReport,
    });
  }
  if (url.pathname === "/api/v1/inspectors/inspection-tasks") {
    const tasks = listing.inspectionTask ? [listing.inspectionTask] : [];
    return send(response, 200, {
      data: tasks,
      meta: { page: 1, limit: 20, total: tasks.length, totalPages: 1 },
    });
  }
  if (
    listing.inspectionTask &&
    url.pathname === `/api/v1/inspectors/inspection-tasks/${listing.inspectionTask.id}`
  ) {
    return send(response, 200, {
      task: listing.inspectionTask,
      report: listing.inspectionReport,
    });
  }
  if (
    request.method === "POST" &&
    listing.inspectionTask &&
    url.pathname === `/api/v1/inspectors/inspection-tasks/${listing.inspectionTask.id}/report`
  ) {
    return send(response, 200, submitInspectionReport(await readBody(request)));
  }
  if (url.pathname === "/api/v1/admin/listings" && request.method === "GET") {
    return send(response, 200, {
      data: [listing],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
  }
  if (url.pathname === `/api/v1/admin/listings/${listing.id}`)
    return send(response, 200, listing);
  if (url.pathname === `/api/v1/listings/${listing.id}` && request.method === "GET")
    return send(response, 200, listing);
  if (url.pathname === `/api/v1/listings/${listing.id}/timeline` && request.method === "GET") {
    return send(response, 200, {
      listingId: listing.id,
      history: [{ id: "history-1", status: listing.status, actorId: "admin-1", actorRole: "ADMIN", note: listing.changesNote, occurredAt: now }],
    });
  }
  if (
    request.method === "POST" &&
    url.pathname.startsWith(`/api/v1/admin/listings/${listing.id}/`)
  ) {
    const updated = updateAction(url.pathname, await readBody(request));
    return updated
      ? send(response, 200, listing)
      : send(response, 409, apiError("Trust gates are incomplete"));
  }
  return send(response, 404, apiError("Not found", 404));
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    send(
      response,
      500,
      apiError(error instanceof Error ? error.message : "Mock failure", 500),
    );
  });
});

server.listen(port, host, () => {
  console.log(`Admin mock API listening on http://${host}:${port}`);
});

process.on("SIGTERM", () => server.close());
