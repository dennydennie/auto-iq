import { Injectable } from "@nestjs/common";
import { ApprovedViewingLocationRepository } from "../../db/repository/approved-viewing-location.repository";
import {
  BODY_TYPES,
  DRIVE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "../../common/constants/listing.constants";

@Injectable()
export class ReferenceDataService {
  constructor(private readonly locationRepository: ApprovedViewingLocationRepository) {}

  async getAll() {
    const locations = await this.locationRepository.findActive();
    return {
      makes: this.getMakes(),
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

  getMakes() {
    return [
      { id: "toyota", name: "Toyota", logoUrl: null, popularModels: ["Hilux", "Corolla", "Fortuner"] },
      { id: "honda", name: "Honda", logoUrl: null, popularModels: ["CR-V", "Civic", "Fit"] },
      { id: "mazda", name: "Mazda", logoUrl: null, popularModels: ["Demio", "CX-5", "BT-50"] },
      { id: "nissan", name: "Nissan", logoUrl: null, popularModels: ["X-Trail", "Navara", "Note"] },
    ];
  }
}

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
