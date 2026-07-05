/** All /api/v1 route paths as typed builder functions or constants. */

const BASE = '/api/v1';

// ─── Health ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  health: {
    live: `${BASE}/health/live`,
    ready: `${BASE}/health/ready`,
  },

  // ─── Identity ──────────────────────────────────────────────────────────────

  auth: {
    register: `${BASE}/auth/register`,
    csrf: `${BASE}/auth/csrf`,
    login: `${BASE}/auth/login`,
    refresh: `${BASE}/auth/refresh`,
    logout: `${BASE}/auth/logout`,
    sendOtp: `${BASE}/auth/otp/send`,
    verifyOtp: `${BASE}/auth/otp/verify`,
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword: `${BASE}/auth/reset-password`,
  },

  me: {
    profile: `${BASE}/me`,
    consents: `${BASE}/me/consents`,
    savedVehicles: `${BASE}/me/saved-vehicles`,
    savedVehicle: (listingId: string) =>
      `${BASE}/me/saved-vehicles/${listingId}`,
  },

  // ─── Reference data ────────────────────────────────────────────────────────

  referenceData: {
    all: `${BASE}/reference-data`,
  },

  // ─── Storage ───────────────────────────────────────────────────────────────

  storage: {
    imagePresign: `${BASE}/storage/images/presign`,
    documentPresign: `${BASE}/storage/documents/presign`,
    registerImage: (listingId: string) =>
      `${BASE}/listings/${listingId}/images`,
    registerDocument: (listingId: string) =>
      `${BASE}/listings/${listingId}/documents`,
  },

  // ─── Seller listings ───────────────────────────────────────────────────────

  listings: {
    list: `${BASE}/me/listings`,
    create: `${BASE}/listings`,
    detail: (listingId: string) => `${BASE}/listings/${listingId}`,
    upsertSpecs: (listingId: string) =>
      `${BASE}/listings/${listingId}/specs`,
    upsertPricing: (listingId: string) =>
      `${BASE}/listings/${listingId}/pricing`,
    submit: (listingId: string) =>
      `${BASE}/listings/${listingId}/submit`,
    timeline: (listingId: string) =>
      `${BASE}/listings/${listingId}/timeline`,
  },

  // ─── Public catalogue ──────────────────────────────────────────────────────

  catalogue: {
    list: `${BASE}/listings`,
    detail: (slugOrId: string) => `${BASE}/listings/${slugOrId}`,
    inspectionSummary: (slugOrId: string) =>
      `${BASE}/listings/${slugOrId}/inspection-summary`,
    /** Distinct make + count aggregated across PUBLISHED listings. */
    makeFacets: `${BASE}/listings/facets/makes`,
    /** Distinct models for a make. Query param: ?make=Toyota */
    modelFacets: `${BASE}/listings/facets/models`,
  },

  // ─── Quotes ────────────────────────────────────────────────────────────────

  quotes: {
    create: (listingId: string) =>
      `${BASE}/listings/${listingId}/quotes`,
    buyerList: `${BASE}/me/quotes`,
  },

  // ─── Vehicle requests ──────────────────────────────────────────────────────

  vehicleRequests: {
    create: `${BASE}/vehicle-requests`,
    buyerList: `${BASE}/me/vehicle-requests`,
  },

  // ─── Viewings ─────────────────────────────────────────────────────────────

  viewings: {
    create: (listingId: string) =>
      `${BASE}/listings/${listingId}/viewings`,
    buyerList: `${BASE}/me/viewings`,
    sellerConfirm: (viewingId: string) =>
      `${BASE}/me/viewings/${viewingId}/seller-confirm`,
  },

  // ─── Inspectors ────────────────────────────────────────────────────────────

  inspectors: {
    taskList: `${BASE}/inspectors/inspection-tasks`,
    taskDetail: (taskId: string) =>
      `${BASE}/inspectors/inspection-tasks/${taskId}`,
    submitReport: (taskId: string) =>
      `${BASE}/inspectors/inspection-tasks/${taskId}/report`,
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  admin: {
    dashboard: `${BASE}/admin/dashboard`,

    // Listings
    listings: `${BASE}/admin/listings`,
    listing: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}`,
    listingRequestChanges: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/request-changes`,
    listingApprove: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/approve`,
    listingPublish: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/publish`,
    listingReject: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/reject`,
    listingDelist: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/delist`,
    listingMarkSold: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/mark-sold`,
    listingMarkReserved: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/mark-reserved`,
    listingCreateInspectionTask: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/inspection-tasks`,
    listingOwnershipVerification: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/ownership-verification`,
    listingApproveSummary: (listingId: string) =>
      `${BASE}/admin/listings/${listingId}/inspection-summary/approve`,

    // Quotes
    quotes: `${BASE}/admin/quotes`,
    quote: (quoteId: string) => `${BASE}/admin/quotes/${quoteId}`,

    // Vehicle requests
    vehicleRequests: `${BASE}/admin/vehicle-requests`,
    vehicleRequest: (requestId: string) =>
      `${BASE}/admin/vehicle-requests/${requestId}`,

    // Viewings
    viewings: `${BASE}/admin/viewings`,
    viewing: (viewingId: string) =>
      `${BASE}/admin/viewings/${viewingId}`,
    viewingConfirm: (viewingId: string) =>
      `${BASE}/admin/viewings/${viewingId}/confirm`,
    viewingReschedule: (viewingId: string) =>
      `${BASE}/admin/viewings/${viewingId}/reschedule`,
    viewingCancel: (viewingId: string) =>
      `${BASE}/admin/viewings/${viewingId}/cancel`,
    viewingComplete: (viewingId: string) =>
      `${BASE}/admin/viewings/${viewingId}/complete`,

    // Notifications
    notifications: `${BASE}/admin/notifications`,
    notificationRetry: (notificationId: string) =>
      `${BASE}/admin/notifications/${notificationId}/retry`,
  },
} as const;
