/**
 * Tenant-configured reference data returned by the API.
 * Used to populate wizard dropdowns and filter panels.
 */

export interface MakeDto {
  id: string;
  name: string;
  logoUrl: string | null;
  popularModels: string[];
}

export interface ReferenceOptionDto {
  value: string;
  label: string;
}

export type BodyTypeDto = ReferenceOptionDto;
export type FuelTypeDto = ReferenceOptionDto;
export type TransmissionTypeDto = ReferenceOptionDto;
export type DriveTypeDto = ReferenceOptionDto;
export type ConditionGradeDto = ReferenceOptionDto;

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
  conditionGrades: ConditionGradeDto[];
  viewingLocations: ApprovedViewingLocationDto[];
}
