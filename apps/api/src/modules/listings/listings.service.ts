import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import { VehicleMakeEntity } from "../../db/entity/vehicle-make.entity";
import { VehicleModelEntity } from "../../db/entity/vehicle-model.entity";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { VehiclePricingEntity } from "../../db/entity/vehicle-pricing.entity";
import { VehicleSpecsEntity } from "../../db/entity/vehicle-specs.entity";
import { VehicleStatusHistoryEntity } from "../../db/entity/vehicle-status-history.entity";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { VehicleStatusHistoryRepository } from "../../db/repository/vehicle-status-history.repository";
import { VehiclePricingRepository } from "../../db/repository/vehicle-pricing.repository";
import { VehicleSpecsRepository } from "../../db/repository/vehicle-specs.repository";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notification.service";
import { StorageService } from "../storage/storage.service";
import {
  CreateListingDto,
  SellerListingsQueryDto,
  SubmitListingDto,
  UpsertListingDisclosureDto,
  UpsertListingPricingDto,
  UpsertListingSpecsDto,
} from "./dto/listings.dto";
import { ListingStateService } from "./listing-state.service";
import { ListingWizardValidator } from "./listing-wizard.validator";
import { SellerListingAccessService } from "./seller-listing-access.service";
import { normalizeName, slugify as slugifyTaxonomy } from "../../db/repository/vehicle-make.repository";

@Injectable()
export class ListingsService {
  constructor(
    private readonly accessService: SellerListingAccessService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    private readonly listingStateService: ListingStateService,
    private readonly notificationService: NotificationService,
    private readonly pricingRepository: VehiclePricingRepository,
    private readonly specsRepository: VehicleSpecsRepository,
    private readonly storageService: StorageService,
    private readonly userRepository: UserRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly vehicleStatusHistoryRepository: VehicleStatusHistoryRepository,
    private readonly wizardValidator: ListingWizardValidator,
  ) {}

  async list(userId: string, query: SellerListingsQueryDto) {
    await this.accessService.assertSellerReady(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [listings, total] = await this.vehicleRepository.findSellerPage({
      sellerUserId: userId,
      page,
      limit,
      status: query.status,
      sortBy: query.sortBy ?? "updatedAt",
      sortDir: query.sortDir ?? "DESC",
    });

    return {
      data: await Promise.all(listings.map((listing) => this.toSummaryDto(listing))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(userId: string, body: CreateListingDto) {
    await this.accessService.assertSellerReady(userId);
    const listingId = await this.dataSource.transaction(async (manager) => {
      const normalizedSpecs = await normalizeSpecs(manager, body);
      const slug = await generateListingSlug(manager, body.year, normalizedSpecs.make, normalizedSpecs.model);
      const vehicle = manager.create(VehicleEntity, {
        sellerUserId: userId,
        slug,
        status: "DRAFT",
        sellerDisclosure: null,
        viewCount: 0,
        viewingCount: 0,
        quoteCount: 0,
        changesNote: null,
        submittedAt: null,
        publishedAt: null,
      });
      const savedVehicle = await manager.save(vehicle);

      const specs = manager.create(VehicleSpecsEntity, {
        vehicleId: savedVehicle.id,
        ...normalizedSpecs,
      });
      const pricing = manager.create(VehiclePricingEntity, {
        vehicleId: savedVehicle.id,
        askPriceUsd: body.askPriceUsd.toFixed(2),
        negotiable: body.negotiable ?? false,
        currency: "USD",
      });
      const history = manager.create(VehicleStatusHistoryEntity, {
        vehicleId: savedVehicle.id,
        status: "DRAFT",
        actorId: userId,
        actorRole: "SELLER",
        note: "Listing created",
      });

      await manager.save(specs);
      await manager.save(pricing);
      await manager.save(history);
      return savedVehicle.id;
    });

    return this.detail(userId, listingId);
  }

  async detail(userId: string, listingId: string) {
    const listing = await this.accessService.getOwnedListing(userId, listingId);
    return this.toDetailDto(listing);
  }

  async upsertSpecs(userId: string, listingId: string, body: UpsertListingSpecsDto) {
    const listing = await this.accessService.getOwnedEditableListing(userId, listingId);
    const specs = listing.specs ?? this.specsRepository.create({ vehicleId: listing.id });
    Object.assign(specs, await normalizeSpecs(this.dataSource.manager, body));
    await this.specsRepository.save(specs);
    return this.detail(userId, listingId);
  }

  async upsertPricing(userId: string, listingId: string, body: UpsertListingPricingDto) {
    const listing = await this.accessService.getOwnedEditableListing(userId, listingId);
    const pricing = listing.pricing ?? this.pricingRepository.create({
      vehicleId: listing.id,
      currency: "USD",
    });
    pricing.askPriceUsd = body.askPriceUsd.toFixed(2);
    pricing.negotiable = body.negotiable ?? false;
    pricing.currency = "USD";
    await this.pricingRepository.save(pricing);
    return this.detail(userId, listingId);
  }

  async updateDisclosure(userId: string, listingId: string, body: UpsertListingDisclosureDto) {
    const listing = await this.accessService.getOwnedEditableListing(userId, listingId);
    listing.sellerDisclosure = body.sellerDisclosure.trim();
    await this.vehicleRepository.save(listing);
    return this.detail(userId, listingId);
  }

  async submit(userId: string, listingId: string, body: SubmitListingDto) {
    const listing = await this.accessService.getOwnedListing(userId, listingId);
    const nextStatus = this.listingStateService.transitionForSeller(listing.status, "SUBMITTED");
    listing.sellerDisclosure = body.sellerDisclosure.trim();
    this.wizardValidator.validateForSubmit(listing, listing.sellerDisclosure);
    listing.status = nextStatus;
    listing.submittedAt = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.save(VehicleEntity, listing);
      await manager.save(VehicleStatusHistoryEntity, this.vehicleStatusHistoryRepository.create({
        vehicleId: listing.id,
        status: nextStatus,
        actorId: userId,
        actorRole: "SELLER",
        note: "Listing submitted for review",
      }));
    });
    const admins = await this.userRepository.findByRole("ADMIN");
    await Promise.all(admins.map((admin) => this.notificationService.notifyUser({
      userId: admin.id,
      email: admin.email,
      phone: admin.phone,
      template: "LISTING_SUBMITTED",
      idempotencyKeyBase: `listing:${listing.id}:submitted:${admin.id}`,
      payload: { listingId: listing.id, slug: listing.slug },
      channels: ["EMAIL"],
    })));
    await this.auditService.record({
      action: "notification.listing_submitted",
      actorUserId: userId,
      entityType: "listing",
      entityId: listing.id,
      outcome: "success",
    });
    return this.detail(userId, listingId);
  }

  async timeline(userId: string, listingId: string) {
    await this.accessService.assertSellerReady(userId);
    const listing = await this.vehicleRepository.findOwnedTimeline(listingId, userId);
    if (!listing) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Listing not found",
      });
    }
    const history = await this.vehicleStatusHistoryRepository.findByVehicleId(listing.id);
    return {
      listingId,
      history: history.map((entry) => ({
        id: entry.id,
        status: entry.status,
        actorId: entry.actorId ?? "",
        actorRole: entry.actorRole,
        note: entry.note,
        occurredAt: entry.occurredAt.toISOString(),
      })),
    };
  }

  private async toSummaryDto(listing: VehicleEntity) {
    const cover = listing.images?.find((image) => image.isCover) ?? null;
    return {
      id: listing.id,
      slug: listing.slug,
      status: listing.status,
      year: listing.specs.year,
      make: listing.specs.make,
      model: listing.specs.model,
      bodyType: listing.specs.bodyType,
      askPriceUsd: Number(listing.pricing.askPriceUsd),
      coverImageUrl: cover ? await this.storageService.getDisplayUrl(cover.storageKey) : null,
      viewCount: listing.viewCount,
      viewingCount: listing.viewingCount,
      quoteCount: listing.quoteCount,
      changesNote: listing.changesNote,
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  private async toDetailDto(listing: VehicleEntity) {
    const images = [...(listing.images ?? [])].sort((left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime(),
    );
    const documents = [...(listing.documents ?? [])].sort((left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime(),
    );

    return {
      id: listing.id,
      slug: listing.slug,
      status: listing.status,
      sellerDisclosure: listing.sellerDisclosure,
      viewCount: listing.viewCount,
      viewingCount: listing.viewingCount,
      quoteCount: listing.quoteCount,
      changesNote: listing.changesNote,
      submittedAt: listing.submittedAt?.toISOString() ?? null,
      publishedAt: listing.publishedAt?.toISOString() ?? null,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      specs: {
        makeId: listing.specs.makeId,
        make: listing.specs.make,
        modelId: listing.specs.modelId,
        model: listing.specs.model,
        year: listing.specs.year,
        bodyType: listing.specs.bodyType,
        colour: listing.specs.colour,
        fuelType: listing.specs.fuelType,
        transmission: listing.specs.transmission,
        driveType: listing.specs.driveType,
        engineCapacity: listing.specs.engineCapacity,
        mileageKm: listing.specs.mileageKm,
        condition: listing.specs.condition,
        hasAccidentHistory: listing.specs.hasAccidentHistory,
        accidentNote: listing.specs.accidentNote,
        locationCoordinates: locationCoordinates(listing.specs.locationLatitude, listing.specs.locationLongitude),
      },
      pricing: {
        askPriceUsd: Number(listing.pricing.askPriceUsd),
        negotiable: listing.pricing.negotiable,
        currency: "USD" as const,
      },
      images: await Promise.all(images.map(async (image) => ({
        id: image.id,
        slot: image.slot,
        url: await this.storageService.getDisplayUrl(image.storageKey),
        isCover: image.isCover,
        uploadedAt: image.createdAt.toISOString(),
      }))),
      documents: documents.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        uploadedAt: document.createdAt.toISOString(),
        reviewStatus: document.reviewStatus,
      })),
    };
  }
}

async function normalizeSpecs(manager: EntityManager, body: UpsertListingSpecsDto) {
  const taxonomy = await resolveTaxonomy(manager, body);
  return {
    makeId: taxonomy.makeId,
    make: taxonomy.make,
    modelId: taxonomy.modelId,
    model: taxonomy.model,
    year: body.year,
    bodyType: body.bodyType,
    colour: body.colour.trim(),
    fuelType: body.fuelType,
    transmission: body.transmission,
    driveType: body.driveType,
    engineCapacity: body.engineCapacity?.trim() || null,
    mileageKm: body.mileageKm,
    condition: body.condition,
    hasAccidentHistory: body.hasAccidentHistory,
    accidentNote: body.hasAccidentHistory ? body.accidentNote?.trim() || null : null,
    ...normalizeCoordinates(body),
  };
}

async function resolveTaxonomy(manager: EntityManager, body: UpsertListingSpecsDto) {
  const make = await resolveMake(manager, body.makeId, body.make);
  const model = await resolveModel(manager, make.id, body.modelId, body.model);
  return {
    makeId: make.id,
    make: make.name,
    modelId: model.id,
    model: model.name,
  };
}

async function resolveMake(manager: EntityManager, makeId: string | undefined, name: string) {
  if (makeId) {
    const make = await manager.findOneBy(VehicleMakeEntity, { id: makeId });
    if (!make) {
      throw new BadRequestException({ code: "INVALID_REFERENCE", message: "Selected make was not found" });
    }
    return make;
  }
  const normalized = normalizeName(name);
  const slug = slugifyTaxonomy(normalized);
  const existing = await manager.findOneBy(VehicleMakeEntity, { slug });
  return existing ?? manager.save(VehicleMakeEntity, manager.create(VehicleMakeEntity, {
    name: normalized,
    slug,
    logoUrl: null,
  }));
}

async function resolveModel(
  manager: EntityManager,
  makeId: string,
  modelId: string | undefined,
  name: string,
) {
  if (modelId) {
    const model = await manager.findOneBy(VehicleModelEntity, { id: modelId, makeId });
    if (!model) {
      throw new BadRequestException({ code: "INVALID_REFERENCE", message: "Selected model was not found for this make" });
    }
    return model;
  }
  const normalized = normalizeName(name);
  const slug = slugifyTaxonomy(normalized);
  const existing = await manager.findOneBy(VehicleModelEntity, { makeId, slug });
  return existing ?? manager.save(VehicleModelEntity, manager.create(VehicleModelEntity, {
    makeId,
    name: normalized,
    slug,
  }));
}

function normalizeCoordinates(body: UpsertListingSpecsDto) {
  const latitude = body.locationLatitude;
  const longitude = body.locationLongitude;
  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new BadRequestException({
      code: "INVALID_LOCATION",
      message: "Vehicle latitude and longitude must be provided together",
    });
  }
  if (latitude === undefined || longitude === undefined) {
    return { locationLatitude: null, locationLongitude: null };
  }
  return {
    locationLatitude: latitude.toFixed(6),
    locationLongitude: longitude.toFixed(6),
  };
}

function locationCoordinates(latitude: string | null, longitude: string | null) {
  return latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null;
}

function listingSlugify(year: number, make: string, model: string): string {
  const stem = [year, make, model]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return stem.length > 0 ? stem : `${year}`;
}

async function generateListingSlug(manager: EntityManager, year: number, make: string, model: string): Promise<string> {
  const stem = listingSlugify(year, make, model);

  for (let attempt = 0; attempt < 12; attempt++) {
    const slug = attempt === 0 ? stem : `${stem}-${attempt.toString(36)}`;
    const existing = await manager.findOne(VehicleEntity, { where: { slug }, select: { id: true } });
    if (!existing) {
      return slug;
    }
  }

  throw new ConflictException({
    code: "SLUG_COLLISION",
    message: "Unable to generate unique listing slug",
  });
}
