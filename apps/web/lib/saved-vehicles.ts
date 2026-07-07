import type { SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";

export type SavedVehiclesPayload =
  | SavedVehicleDto[]
  | OffsetPaginatedResponse<SavedVehicleDto>;

export function extractSavedVehicles(
  payload: SavedVehiclesPayload | null | undefined,
): SavedVehicleDto[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.data;
}
