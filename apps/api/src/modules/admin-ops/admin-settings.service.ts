import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovedViewingLocationEntity } from "../../db/entity/approved-viewing-location.entity";
import { ApprovedViewingLocationRepository } from "../../db/repository/approved-viewing-location.repository";
import { ReferenceOptionEntity } from "../../db/entity/reference-option.entity";
import { ReferenceOptionRepository } from "../../db/repository/reference-option.repository";
import { AuditService } from "../audit/audit.service";
import {
  AdminViewingLocationListQueryDto,
  AdminReferenceOptionListQueryDto,
  CreateAdminViewingLocationDto,
  CreateAdminReferenceOptionDto,
  UpdateAdminViewingLocationDto,
  UpdateAdminReferenceOptionDto,
} from "./dto/admin-secondary.dto";

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly locations: ApprovedViewingLocationRepository,
    private readonly options: ReferenceOptionRepository,
  ) {}

  async listLocations(query: AdminViewingLocationListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.locations.findAdminPage({
      page,
      limit,
      search: query.search?.trim(),
      active: query.active,
    });
    return {
      data: rows.map(toLocationDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async createLocation(
    adminUserId: string,
    correlationId: string | undefined,
    body: CreateAdminViewingLocationDto,
  ) {
    const location = this.locations.create({
      ...locationFields(body),
      active: true,
    });
    const saved = await this.locations.save(location);
    await this.audit(adminUserId, correlationId, saved.id, "created");
    return toLocationDto(saved);
  }

  async updateLocation(
    adminUserId: string,
    correlationId: string | undefined,
    locationId: string,
    body: UpdateAdminViewingLocationDto,
  ) {
    const location = await this.requireLocation(locationId);
    if (body.active === false && location.active) {
      await this.assertAnotherActiveLocation();
    }
    applyLocationUpdate(location, body);
    const saved = await this.locations.save(location);
    await this.audit(adminUserId, correlationId, saved.id, "updated");
    return toLocationDto(saved);
  }

  async listReferenceOptions(query: AdminReferenceOptionListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const [rows, total] = await this.options.findAdminPage({
      page,
      limit,
      category: query.category,
      search: query.search?.trim(),
      active: query.active,
    });
    return {
      data: rows.map(toReferenceOptionDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async createReferenceOption(
    adminUserId: string,
    correlationId: string | undefined,
    body: CreateAdminReferenceOptionDto,
  ) {
    const code = body.code.trim().toUpperCase();
    if (await this.options.findByCategoryAndCode(body.category, code)) {
      throw new ConflictException({ code: "RESOURCE_CONFLICT", message: "Reference option already exists" });
    }
    const saved = await this.options.save(this.options.create({
      category: body.category,
      code,
      label: body.label.trim(),
      sortOrder: body.sortOrder ?? 0,
      active: true,
    }));
    await this.auditReferenceOption(adminUserId, correlationId, saved.id, "created");
    return toReferenceOptionDto(saved);
  }

  async updateReferenceOption(
    adminUserId: string,
    correlationId: string | undefined,
    optionId: string,
    body: UpdateAdminReferenceOptionDto,
  ) {
    const option = await this.options.findAnyById(optionId);
    if (!option) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Reference option not found" });
    }
    if (body.active === false && option.active && await this.options.countActive(option.category) <= 1) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "At least one option must remain active in each category",
      });
    }
    if (body.label !== undefined) option.label = body.label.trim();
    if (body.sortOrder !== undefined) option.sortOrder = body.sortOrder;
    if (body.active !== undefined) option.active = body.active;
    const saved = await this.options.save(option);
    await this.auditReferenceOption(adminUserId, correlationId, saved.id, "updated");
    return toReferenceOptionDto(saved);
  }

  private async requireLocation(locationId: string) {
    const location = await this.locations.findAnyById(locationId);
    if (!location) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Viewing location not found",
      });
    }
    return location;
  }

  private async assertAnotherActiveLocation() {
    if ((await this.locations.countActive()) <= 1) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "At least one viewing location must remain active",
      });
    }
  }

  private async audit(
    adminUserId: string,
    correlationId: string | undefined,
    locationId: string,
    verb: string,
  ) {
    await this.auditService.record({
      action: `viewing_location.${verb}`,
      actorUserId: adminUserId,
      entityType: "viewing_location",
      entityId: locationId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: `viewing_location.${verb}`,
      adminId: adminUserId,
      entityType: "viewing_location",
      entityId: locationId,
    });
  }

  private async auditReferenceOption(
    adminUserId: string,
    correlationId: string | undefined,
    optionId: string,
    verb: string,
  ) {
    await this.auditService.record({
      action: `reference_option.${verb}`,
      actorUserId: adminUserId,
      entityType: "reference_option",
      entityId: optionId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: `reference_option.${verb}`,
      adminId: adminUserId,
      entityType: "reference_option",
      entityId: optionId,
    });
  }
}

function locationFields(body: CreateAdminViewingLocationDto) {
  return {
    name: body.name.trim(),
    addressLine1: body.addressLine1.trim(),
    addressLine2: body.addressLine2?.trim() || null,
    city: body.city.trim(),
    latitude: body.latitude === null || body.latitude === undefined ? null : String(body.latitude),
    longitude: body.longitude === null || body.longitude === undefined ? null : String(body.longitude),
  };
}

function applyLocationUpdate(
  location: ApprovedViewingLocationEntity,
  body: UpdateAdminViewingLocationDto,
) {
  if (body.name !== undefined) location.name = body.name.trim();
  if (body.addressLine1 !== undefined) location.addressLine1 = body.addressLine1.trim();
  if (body.addressLine2 !== undefined) location.addressLine2 = body.addressLine2?.trim() || null;
  if (body.city !== undefined) location.city = body.city.trim();
  if (body.latitude !== undefined) location.latitude = body.latitude === null ? null : String(body.latitude);
  if (body.longitude !== undefined) location.longitude = body.longitude === null ? null : String(body.longitude);
  if (body.active !== undefined) location.active = body.active;
}

function toLocationDto(location: ApprovedViewingLocationEntity) {
  return {
    id: location.id,
    name: location.name,
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2,
    city: location.city,
    latitude: location.latitude === null ? null : Number(location.latitude),
    longitude: location.longitude === null ? null : Number(location.longitude),
    active: location.active,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}

function toReferenceOptionDto(option: ReferenceOptionEntity) {
  return {
    id: option.id,
    category: option.category,
    code: option.code,
    label: option.label,
    sortOrder: option.sortOrder,
    active: option.active,
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString(),
  };
}
