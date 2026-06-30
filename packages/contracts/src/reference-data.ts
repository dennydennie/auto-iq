import type { BodyType, FuelType, TransmissionType, DriveType } from './enums.js';

/**
 * Seeded reference data returned by the API.
 * Used to populate wizard dropdowns and filter panels.
 */

export interface MakeDto {
  id: string;
  name: string;
  logoUrl: string | null;
  popularModels: string[];
  models: VehicleModelDto[];
}

export interface VehicleModelDto {
  id: string;
  makeId: string;
  name: string;
}

export interface CreateVehicleMakeRequest {
  name: string;
}

export interface CreateVehicleModelRequest {
  name: string;
}

export interface BodyTypeDto {
  value: BodyType;
  label: string;
}

export interface FuelTypeDto {
  value: FuelType;
  label: string;
}

export interface TransmissionTypeDto {
  value: TransmissionType;
  label: string;
}

export interface DriveTypeDto {
  value: DriveType;
  label: string;
}

export interface ApprovedViewingLocationDto {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  /** Google Maps Plus Code or coordinates */
  coordinates: { lat: number; lng: number } | null;
  active: boolean;
}

export interface ReferenceDataResponse {
  makes: MakeDto[];
  bodyTypes: BodyTypeDto[];
  fuelTypes: FuelTypeDto[];
  transmissionTypes: TransmissionTypeDto[];
  driveTypes: DriveTypeDto[];
  viewingLocations: ApprovedViewingLocationDto[];
}
