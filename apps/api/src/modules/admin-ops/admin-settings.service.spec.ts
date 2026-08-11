import { ConflictException, NotFoundException } from "@nestjs/common";
import { AdminSettingsService } from "./admin-settings.service";

function location(overrides: Record<string, unknown> = {}) {
  return {
    id: "location-1",
    name: "Borrowdale Hub",
    addressLine1: "1 Borrowdale Road",
    addressLine2: null,
    city: "Harare",
    latitude: "-17.750000",
    longitude: "31.100000",
    active: true,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createService() {
  const auditService = {
    record: jest.fn().mockResolvedValue(undefined),
    recordAdminAction: jest.fn().mockResolvedValue(undefined),
  };
  const locations = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => location(value)),
    findAdminPage: jest.fn(),
    findAnyById: jest.fn(),
    countActive: jest.fn(),
  };
  const options = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: "option-1",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      ...value,
    })),
    findAdminPage: jest.fn(),
    findAnyById: jest.fn(),
    findByCategoryAndCode: jest.fn(),
    countActive: jest.fn(),
  };
  return {
    auditService,
    locations,
    options,
    service: new AdminSettingsService(auditService as never, locations as never, options as never),
  };
}

describe("AdminSettingsService", () => {
  it("creates a trimmed active viewing location", async () => {
    const { locations, service } = createService();

    const result = await service.createLocation("admin-1", undefined, {
      name: " Borrowdale Hub ",
      addressLine1: " 1 Borrowdale Road ",
      city: " Harare ",
      latitude: -17.75,
      longitude: 31.1,
    });

    expect(result).toMatchObject({ name: "Borrowdale Hub", active: true });
    expect(locations.create).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Harare", latitude: "-17.75" }),
    );
  });

  it("prevents deactivation of the final active location", async () => {
    const { locations, service } = createService();
    locations.findAnyById.mockResolvedValue(location());
    locations.countActive.mockResolvedValue(1);

    await expect(
      service.updateLocation("admin-1", undefined, "location-1", { active: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("returns not found for a location outside the tenant", async () => {
    const { locations, service } = createService();
    locations.findAnyById.mockResolvedValue(null);

    await expect(
      service.updateLocation("admin-1", undefined, "foreign-location", { active: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("adds a normalized reference option", async () => {
    const { options, service } = createService();
    options.findByCategoryAndCode.mockResolvedValue(null);

    const result = await service.createReferenceOption("admin-1", undefined, {
      category: "FUEL_TYPE",
      code: "hydrogen",
      label: " Hydrogen ",
      sortOrder: 20,
    });

    expect(result).toMatchObject({ code: "HYDROGEN", label: "Hydrogen", active: true });
  });

  it("keeps one active option per category", async () => {
    const { options, service } = createService();
    options.findAnyById.mockResolvedValue({
      id: "option-1",
      category: "FUEL_TYPE",
      code: "PETROL",
      label: "Petrol",
      sortOrder: 0,
      active: true,
    });
    options.countActive.mockResolvedValue(1);

    await expect(
      service.updateReferenceOption("admin-1", undefined, "option-1", { active: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
