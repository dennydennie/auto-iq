import { BadRequestException, Injectable } from "@nestjs/common";
import { VehicleMakeEntity } from "../../db/entity/vehicle-make.entity";
import { ApprovedViewingLocationRepository } from "../../db/repository/approved-viewing-location.repository";
import { VehicleMakeRepository } from "../../db/repository/vehicle-make.repository";
import {
  BODY_TYPES,
  DRIVE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "../../common/constants/listing.constants";

@Injectable()
export class ReferenceDataService {
  constructor(
    private readonly locationRepository: ApprovedViewingLocationRepository,
    private readonly vehicleMakeRepository: VehicleMakeRepository,
  ) {}

  async getAll() {
    const locations = await this.locationRepository.findActive();
    return {
      makes: await this.getMakes(),
      bodyTypes: BODY_TYPES.map((value) => ({ value, label: labelize(value) })),
      fuelTypes: FUEL_TYPES.map((value) => ({ value, label: labelize(value) })),
      transmissionTypes: TRANSMISSION_TYPES.map((value) => ({ value, label: labelize(value) })),
      driveTypes: DRIVE_TYPES.map((value) => ({ value, label: labelize(value) })),
      viewingLocations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        addressLine1: location.addressLine1,
        addressLine2: location.addressLine2,
        city: location.city,
        coordinates: location.latitude && location.longitude
          ? { lat: Number(location.latitude), lng: Number(location.longitude) }
          : null,
        active: location.active,
      })),
    };
  }

  async createMake(name: string) {
    const make = await this.vehicleMakeRepository.createMake(name);
    return toMakeDto(make);
  }

  async createModel(makeId: string, name: string) {
    const make = await this.vehicleMakeRepository.findById(makeId);
    if (!make) {
      throw new BadRequestException({ code: "INVALID_REFERENCE", message: "Selected make was not found" });
    }
    const model = await this.vehicleMakeRepository.createModel(makeId, name);
    return { id: model.id, makeId: model.makeId, name: model.name };
  }

  async getMakes() {
    const makes = await this.vehicleMakeRepository.findAllWithModels();
    return makes.map(toMakeDto);
  }
}

function toMakeDto(make: VehicleMakeEntity) {
  const models = (make.models ?? []).map((model) => ({
    id: model.id,
    makeId: model.makeId,
    name: model.name,
  }));
  return {
    id: make.id,
    name: make.name,
    logoUrl: make.logoUrl,
    popularModels: models.map((model) => model.name),
    models,
  };
}

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
