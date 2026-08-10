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

function inspectionTask() {
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
    status: "REPORT_SUBMITTED",
    assignedInspectorId: "inspector-1",
    assignedInspectorName: "Inspector One",
    scheduledAt: now,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function inspectionReport(buyerSummaryApproved) {
  return {
    id: "report-1",
    taskId: "task-1",
    listingId: "11111111-1111-4111-8111-111111111111",
    submittedByInspectorId: "inspector-1",
    submittedByInspectorName: "Inspector One",
    overallScore: 86,
    roadworthy: true,
    inspectorNote: "Roadworthy and ready for buyer review.",
    findings: [],
    buyerSummaryApproved,
    buyerSummaryApprovedAt: buyerSummaryApproved ? now : null,
    buyerSummaryApprovedByAdminId: buyerSummaryApproved ? "admin-1" : null,
    createdAt: now,
    updatedAt: now,
  };
}

let listing = initialListing();

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
    listing.inspectionReport.buyerSummaryApproved
  );
}

function updateAction(pathname, body) {
  if (pathname.endsWith("/ownership-verification")) {
    listing.ownershipVerification = verification(body.status);
  } else if (pathname.endsWith("/inspection-summary/approve")) {
    listing.inspectionReport = inspectionReport(true);
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

async function handle(request, response) {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (url.pathname === "/health") return send(response, 200, { ok: true });
  if (url.pathname === "/__reset") {
    listing = initialListing();
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
  if (url.pathname === "/api/v1/admin/listings" && request.method === "GET") {
    return send(response, 200, {
      data: [listing],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
  }
  if (url.pathname === `/api/v1/admin/listings/${listing.id}`)
    return send(response, 200, listing);
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
