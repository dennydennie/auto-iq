import type { PublicListingDto } from "../../../../packages/contracts/src/catalogue";
import type { ApiError } from "../../../../packages/contracts/src/error";
import type { CsrfResponse, MeResponse } from "../../../../packages/contracts/src/identity";
import { ROUTES } from "../../../../packages/contracts/src/routes";

describe("Phase 7 contracts", () => {
  it("exports the csrf route and cookie-auth response contract", () => {
    const csrf: CsrfResponse = {
      token: "csrf-token",
      headerName: "X-CSRF-Token",
    };

    expect(ROUTES.auth.csrf).toBe("/api/v1/auth/csrf");
    expect(csrf.headerName).toBe("X-CSRF-Token");
  });

  it("keeps the public listing dto free of private seller fields", () => {
    const listing: PublicListingDto = {
      id: "listing-1",
      slug: "toyota-hilux-2021-listing-1",
      year: 2021,
      make: "Toyota",
      model: "Hilux",
      bodyType: "BAKKIE",
      colour: "White",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      driveType: "4WD",
      engineCapacity: "2.8L",
      mileageKm: 123000,
      askPriceUsd: 19500,
      negotiable: true,
      sellerDisclosure: "Maintained on schedule.",
      city: "Harare",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      images: [],
      inspectionSummary: null,
      bisellVerified: true,
      publishedAt: "2026-06-08T12:00:00.000Z",
      daysListed: 2,
      viewCount: 18,
    };

    expect(Object.keys(listing)).not.toContain("sellerUserId");
    expect(Object.keys(listing)).not.toContain("documents");
    expect(Object.keys(listing)).not.toContain("storageKey");
  });

  it("matches the api error envelope expected for validation failures", () => {
    const error: ApiError = {
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      correlationId: "corr-1",
      statusCode: 422,
      details: [{ field: "request", message: "email must be an email" }],
    };

    expect(error.statusCode).toBe(422);
    expect(error.details?.[0]?.field).toBe("request");
  });

  it("keeps me response aligned with the published identity contract", () => {
    const me: MeResponse = {
      id: "user-1",
      fullName: "Buyer One",
      email: "buyer@example.com",
      phone: "+263771234567",
      status: "ACTIVE",
      roles: ["BUYER"],
      phoneVerified: true,
      emailVerified: true,
      buyerProfile: {
        id: "buyer-profile-1",
        city: "Harare",
        preferredBodyTypes: ["SUV"],
        preferredMakes: ["Toyota"],
        budgetMin: 10000,
        budgetMax: 20000,
      },
      sellerProfile: null,
      createdAt: "2026-06-08T12:00:00.000Z",
      updatedAt: "2026-06-08T12:00:00.000Z",
    };

    expect(me.roles).toContain("BUYER");
    expect(me.buyerProfile?.city).toBe("Harare");
  });
});
