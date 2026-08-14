import { Injectable } from "@nestjs/common";
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
    private readonly makeRepository: VehicleMakeRepository,
  ) {}

  async getAll() {
    const [locations, makes] = await Promise.all([
      this.locationRepository.findActive(),
      this.getMakes(),
    ]);
    return {
      makes,
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

  async getMakes() {
    const makes = await this.makeRepository.findActiveCatalogue();
    return makes.map((make) => ({
      id: make.code,
      name: make.name,
      logoUrl: make.logoUrl,
      popularModels: make.models.map((model) => model.name),
    }));
  }
}

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
