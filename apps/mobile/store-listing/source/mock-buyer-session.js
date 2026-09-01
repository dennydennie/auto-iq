async (page) => {
  const apiOrigin = "https://api-production-af6d.up.railway.app";
  const imageUrl = "http://127.0.0.1:7359/images/honda-vezel-hero.jpg";
  const listing = {
    id: "listing-vezel-1",
    slug: "2021-honda-vezel-hybrid",
    year: 2021,
    make: "Honda",
    model: "Vezel Hybrid",
    bodyType: "SUV",
    askPriceUsd: 19500,
    negotiable: true,
    city: "Harare",
    coverImageUrl: imageUrl,
    bisellVerified: true,
    inspectionScore: 91,
    daysListed: 4,
  };
  const responses = {
    "/api/v1/me": {
      id: "buyer-demo",
      fullName: "Tariro Moyo",
      email: "tariro@example.com",
      phone: "+263771234567",
      status: "ACTIVE",
      roles: ["BUYER"],
      phoneVerified: true,
      emailVerified: true,
      acceptedConsents: ["TERMS", "PRIVACY", "BUYER_RULES", "NO_SIDE_DEAL"],
      consentsComplete: true,
      buyerProfile: {
        city: "Harare",
        vehiclePurpose: "FAMILY",
        searchRadiusKm: 50,
        deliveryPreference: "EITHER",
        paymentPreference: "FINANCE",
        preferredBodyTypes: ["SUV"],
        preferredMakes: ["Honda", "Toyota"],
        preferredFuelTypes: ["HYBRID"],
        preferredTransmissions: ["AUTOMATIC"],
        minSeats: 5,
        maxMileageKm: 90000,
        yearMin: 2019,
        yearMax: 2024,
        budgetMin: 15000,
        budgetMax: 25000,
      },
      sellerProfile: null,
    },
    "/api/v1/reference-data": {
      makes: [
        {
          id: "make-honda",
          name: "Honda",
          popularModels: ["Vezel", "Fit", "CR-V"],
        },
        {
          id: "make-toyota",
          name: "Toyota",
          popularModels: ["Aqua", "Hilux", "Fortuner"],
        },
      ],
      bodyTypes: [
        { value: "SUV", label: "SUV" },
        { value: "SEDAN", label: "Sedan" },
        { value: "HATCH", label: "Hatch" },
      ],
      fuelTypes: [
        { value: "HYBRID", label: "Hybrid" },
        { value: "PETROL", label: "Petrol" },
        { value: "ELECTRIC", label: "Electric" },
      ],
      transmissionTypes: [
        { value: "AUTOMATIC", label: "Automatic" },
        { value: "MANUAL", label: "Manual" },
        { value: "CVT", label: "CVT" },
      ],
      driveTypes: [
        { value: "FWD", label: "Front-wheel drive" },
        { value: "AWD", label: "All-wheel drive" },
      ],
      conditionGrades: [
        { value: "EXCELLENT", label: "Excellent" },
        { value: "GOOD", label: "Good" },
      ],
      viewingLocations: [
        {
          id: "harare-centre",
          name: "Harare Viewing Centre",
          addressLine1: "1 Samora Machel Avenue",
          addressLine2: null,
          city: "Harare",
        },
        {
          id: "bulawayo-centre",
          name: "Bulawayo Viewing Centre",
          addressLine1: "10 Main Street",
          addressLine2: null,
          city: "Bulawayo",
        },
      ],
    },
    "/api/v1/listings": {
      data: [
        listing,
        {
          ...listing,
          id: "listing-vezel-2",
          slug: "2020-honda-vezel-rs",
          year: 2020,
          model: "Vezel RS",
          askPriceUsd: 17750,
          city: "Bulawayo",
          inspectionScore: 88,
          daysListed: 7,
        },
      ],
      meta: { nextCursor: null, hasMore: false },
    },
    "/api/v1/listings/facets/makes": [
      { make: "Honda", count: 2 },
      { make: "Toyota", count: 1 },
    ],
    "/api/v1/listings/facets/models": [
      { make: "Honda", model: "Vezel Hybrid", count: 1 },
      { make: "Honda", model: "Vezel RS", count: 1 },
      { make: "Toyota", model: "Aqua", count: 1 },
    ],
    "/api/v1/listings/listing-vezel-1": {
      ...listing,
      colour: "Midnight blue",
      fuelType: "HYBRID",
      transmission: "AUTOMATIC",
      driveType: "FWD",
      engineCapacity: "1.5L",
      mileageKm: 64200,
      sellerDisclosure: "Full service history available. No accident damage.",
      images: [
        {
          id: "image-1",
          url: imageUrl,
          slot: "FRONT_THREE_QUARTER",
          isCover: true,
        },
      ],
      inspectionSummary: {
        inspectionDate: "2026-08-08T09:00:00.000Z",
        inspectorName: "BiSell Inspection Team",
        overallScore: 91,
        roadworthy: true,
        inspectorNote: "Clean hybrid SUV with consistent service history.",
        categories: [
          { category: "ENGINE", score: 93, worstRating: "PASS" },
          { category: "BODY", score: 89, worstRating: "WATCH" },
        ],
        findings: [
          {
            label: "Hybrid system",
            rating: "PASS",
            note: "Diagnostic scan completed.",
          },
          {
            label: "Tyres",
            rating: "PASS",
            note: "Even wear with safe tread depth.",
          },
          {
            label: "Bodywork",
            rating: "WATCH",
            note: "Minor cosmetic marks on rear bumper.",
          },
        ],
      },
      publishedAt: "2026-08-08T12:00:00.000Z",
      viewCount: 184,
    },
    "/api/v1/me/saved-vehicles": {
      data: [
        {
          id: "saved-1",
          savedAt: "2026-08-10T08:00:00.000Z",
          listing,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    "/api/v1/me/quotes": {
      data: [
        {
          id: "quote-1",
          listingId: listing.id,
          offerPriceUsd: 18500,
          askPriceUsd: 19500,
          paymentPlan: "BANK_TRANSFER",
          message: "Ready to view this week.",
          status: "UNDER_REVIEW",
          counterPriceUsd: null,
          responseNote: null,
          createdAt: "2026-08-11T09:30:00.000Z",
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    "/api/v1/me/vehicle-requests": {
      data: [
        {
          id: "request-1",
          maxBudgetCents: 2200000,
          makeName: "Honda",
          model: "Vezel",
          yearMin: 2020,
          yearMax: 2024,
          maxOdometerKm: 80000,
          urgency: "ONE_MONTH",
          status: "SOURCING",
          notes: "Hybrid preferred",
          adminNote: "Two verified matches under review.",
          createdAt: "2026-08-09T11:15:00.000Z",
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    "/api/v1/me/viewings": {
      data: [
        {
          id: "viewing-1",
          listingId: listing.id,
          status: "CONFIRMED",
          preferredSlot: "2026-08-15T10:00:00.000Z",
          confirmedSlot: "2026-08-15T10:00:00.000Z",
          location: {
            id: "harare-centre",
            name: "Harare Viewing Centre",
            addressLine1: "1 Samora Machel Avenue",
            addressLine2: null,
            city: "Harare",
          },
          note: "Please have the inspection report ready.",
          outcomeNote: null,
          participants: [
            { name: "Tariro Moyo", role: "BUYER", confirmed: true },
            { name: "Verified seller", role: "SELLER", confirmed: true },
          ],
          listingSnapshot: {
            year: 2021,
            make: "Honda",
            model: "Vezel Hybrid",
          },
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
  };

  await page.unroute(`${apiOrigin}/api/v1/me`);
  await page.unroute(`${apiOrigin}/api/v1/**`);
  await page.route(`${apiOrigin}/api/v1/**`, async (route) => {
    const path = route.request().url().split("?")[0].replace(apiOrigin, "");
    const body = responses[path];
    if (!body) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "NOT_FOUND", message: path }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.reload();
  await page.waitForTimeout(2200);
}
