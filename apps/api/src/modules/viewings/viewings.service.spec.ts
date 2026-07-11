import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ViewingStateService } from "./viewing-state.service";
import { ViewingsService } from "./viewings.service";

describe("ViewingsService", () => {
  type ServiceDependencies = ConstructorParameters<typeof ViewingsService>;

  function viewingFixture(sellerUserId = "seller-1") {
    return {
      id: "viewing-1",
      listingId: "listing-1",
      buyerUserId: "buyer-1",
      sellerUserId,
      status: "REQUESTED",
      preferredSlot: new Date("2026-06-10T08:30:00.000Z"),
      confirmedSlot: null,
      locationId: "location-1",
      listingSnapshot: {
        year: 2021,
        make: "Toyota",
        model: "Hilux",
        coverImageStorageKey: null,
      },
      note: null,
      outcomeNote: null,
      completedAt: null,
      createdAt: new Date("2026-06-09T08:00:00.000Z"),
      updatedAt: new Date("2026-06-09T08:00:00.000Z"),
      buyer: {
        id: "buyer-1",
        fullName: "Buyer One",
        email: "buyer@example.com",
        phone: "+2631",
      },
      seller: {
        id: sellerUserId,
        fullName: "Seller One",
        email: "seller@example.com",
        phone: "+2632",
      },
      location: {
        id: "location-1",
        name: "Auto IQ Yard",
        addressLine1: "1 Test Road",
        addressLine2: null,
        city: "Harare",
        latitude: null,
        longitude: null,
        active: true,
      },
      participants: [
        {
          userId: "buyer-1",
          role: "BUYER",
          confirmed: true,
          user: { fullName: "Buyer One" },
        },
        {
          userId: sellerUserId,
          role: "SELLER",
          confirmed: false,
          user: { fullName: "Seller One" },
        },
      ],
    };
  }

  function createService(overrides: Record<number, unknown> = {}) {
    const dependencies = [
      { record: jest.fn(), recordAdminAction: jest.fn() } as never,
      { findActiveById: jest.fn() } as never,
      { notifyUser: jest.fn() } as never,
      { consume: jest.fn().mockResolvedValue(9) } as never,
      { getDisplayUrl: jest.fn() } as never,
      { findProfileById: jest.fn(), findByRole: jest.fn() } as never,
      { findPublicBySlugOrId: jest.fn(), save: jest.fn() } as never,
      {
        save: jest.fn(),
        create: jest.fn(),
        findByViewingId: jest.fn(),
      } as never,
      {
        save: jest.fn(),
        create: jest.fn(),
        findByIdWithRelations: jest.fn(),
      } as never,
      new ViewingStateService() as never,
    ];

    Object.assign(dependencies, overrides);
    return new ViewingsService(
      ...(dependencies as unknown as ServiceDependencies),
    );
  }

  it("rejects a viewing request for an unapproved location", async () => {
    const service = createService({
      1: { findActiveById: jest.fn().mockResolvedValue(null) } as never,
      5: {
        findProfileById: jest.fn().mockResolvedValue({ id: "buyer-1" }),
        findByRole: jest.fn().mockResolvedValue([]),
      } as never,
      6: {
        findPublicBySlugOrId: jest.fn().mockResolvedValue({
          id: "listing-1",
          status: "PUBLISHED",
          sellerUserId: "seller-1",
          seller: {
            id: "seller-1",
            email: "seller@example.com",
            phone: "+2631",
          },
          specs: { year: 2021, make: "Toyota", model: "Hilux" },
          images: [],
          viewingCount: 0,
        }),
      } as never,
    });

    await expect(
      service.requestViewing("buyer-1", "corr-1", "listing-1", {
        preferredDate: "2026-06-10",
        preferredTime: "10:30",
        locationId: "missing",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects invalid preferred slots before persistence", async () => {
    const viewingRepository = {
      save: jest.fn(),
      create: jest.fn().mockImplementation((viewing) => viewing),
      findByIdWithRelations: jest.fn(),
    };
    const service = createService({
      1: {
        findActiveById: jest
          .fn()
          .mockResolvedValue({ id: "location-1", name: "Auto IQ Yard" }),
      } as never,
      5: {
        findProfileById: jest.fn().mockResolvedValue({ id: "buyer-1" }),
        findByRole: jest.fn().mockResolvedValue([]),
      } as never,
      6: {
        findPublicBySlugOrId: jest.fn().mockResolvedValue({
          id: "listing-1",
          status: "PUBLISHED",
          sellerUserId: "seller-1",
          seller: {
            id: "seller-1",
            email: "seller@example.com",
            phone: "+2631",
          },
          specs: { year: 2021, make: "Toyota", model: "Hilux" },
          images: [],
          viewingCount: 0,
        }),
      } as never,
      8: viewingRepository as never,
    });

    await expect(
      service.requestViewing("buyer-1", "corr-1", "listing-1", {
        preferredDate: "2026-02-31",
        preferredTime: "10:30",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(viewingRepository.save).not.toHaveBeenCalled();
  });

  it("lets the listing seller acknowledge a requested viewing", async () => {
    const viewing = viewingFixture();
    const participantRepository = {
      findByViewingId: jest.fn().mockResolvedValue(viewing.participants),
      save: jest.fn().mockImplementation(async (participant) => participant),
      create: jest.fn().mockImplementation((participant) => participant),
    };
    const viewingRepository = {
      findByIdWithRelations: jest.fn().mockResolvedValue(viewing),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const notificationService = { notifyUser: jest.fn().mockResolvedValue([]) };
    const auditService = { record: jest.fn(), recordAdminAction: jest.fn() };
    const service = createService({
      0: auditService as never,
      2: notificationService as never,
      7: participantRepository as never,
      8: viewingRepository as never,
    });

    const confirmed = await service.sellerAcknowledge(
      "seller-1",
      "corr-1",
      "viewing-1",
    );

    expect(confirmed.status).toBe("PENDING_SELLER_CONFIRMATION");
    expect(confirmed.confirmedSlot).toBeNull();
    expect(participantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "SELLER",
        confirmed: true,
      }),
    );
    expect(notificationService.notifyUser).not.toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "viewing.seller_confirm",
        actorUserId: "seller-1",
      }),
    );
  });

  it("hides viewings from unrelated sellers", async () => {
    const service = createService({
      8: {
        findByIdWithRelations: jest
          .fn()
          .mockResolvedValue(viewingFixture("seller-2")),
      } as never,
    });

    await expect(
      service.sellerAcknowledge("seller-1", undefined, "viewing-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists only viewings attached to the seller's listings", async () => {
    const viewing = viewingFixture();
    const findSellerPage = jest.fn().mockResolvedValue([[viewing], 1]);
    const service = createService({
      8: { findSellerPage } as never,
    });

    const result = await service.listSeller("seller-1", { page: 1, limit: 10 });

    expect(findSellerPage).toHaveBeenCalledWith(
      "seller-1",
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
    expect(result.meta.total).toBe(1);
  });
});
