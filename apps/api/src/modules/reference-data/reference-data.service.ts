import { BadRequestException, Injectable } from "@nestjs/common";
import { ApprovedViewingLocationRepository } from "../../db/repository/approved-viewing-location.repository";
import type { ReferenceOptionCategory } from "../../db/entity/reference-option.entity";
import { ReferenceOptionRepository } from "../../db/repository/reference-option.repository";

@Injectable()
export class ReferenceDataService {
  constructor(
    private readonly locationRepository: ApprovedViewingLocationRepository,
    private readonly optionRepository: ReferenceOptionRepository,
  ) {}

  async getAll() {
    const [locations, options] = await Promise.all([
      this.locationRepository.findActive(),
      this.optionRepository.findActive(),
    ]);
    return {
      makes: this.getMakes(),
      bodyTypes: selectOptions(options, "BODY_TYPE"),
      fuelTypes: selectOptions(options, "FUEL_TYPE"),
      transmissionTypes: selectOptions(options, "TRANSMISSION_TYPE"),
      driveTypes: selectOptions(options, "DRIVE_TYPE"),
      conditionGrades: selectOptions(options, "CONDITION_GRADE"),
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

  async assertActive(category: ReferenceOptionCategory, values: Array<string | undefined>) {
    const codes = [...new Set(values.filter((value): value is string => Boolean(value)))];
    const activeCodes = await this.optionRepository.findActiveCodes(category, codes);
    const invalid = codes.filter((code) => !activeCodes.has(code));
    if (invalid.length > 0) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: `Unknown or inactive ${labelize(category)}: ${invalid.join(", ")}`,
      });
    }
  }
}

function selectOptions(
  options: Array<{ category: ReferenceOptionCategory; code: string; label: string }>,
  category: ReferenceOptionCategory,
) {
  return options
    .filter((option) => option.category === category)
    .map((option) => ({ value: option.code, label: option.label }));
}

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
