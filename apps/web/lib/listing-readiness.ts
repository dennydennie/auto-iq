import {
  REQUIRED_SELLER_DOCUMENT_TYPES,
  type DocumentType,
} from "@auto-iq/contracts/enums";
import {
  MIN_LISTING_PHOTOS,
  MIN_SELLER_DISCLOSURE_LENGTH,
} from "@auto-iq/contracts/listings";
import type {
  VehicleDocumentDto,
  VehicleImageDto,
} from "@auto-iq/contracts/storage";

export function missingRequiredDocuments(
  documents: VehicleDocumentDto[],
): DocumentType[] {
  const uploaded = new Set(documents.map((document) => document.documentType));
  return REQUIRED_SELLER_DOCUMENT_TYPES.filter(
    (documentType) => !uploaded.has(documentType),
  );
}

export function photosAreReady(images: VehicleImageDto[]) {
  return (
    images.length >= MIN_LISTING_PHOTOS && images.some((image) => image.isCover)
  );
}

export function disclosureIsReady(disclosure: string) {
  return disclosure.trim().length >= MIN_SELLER_DISCLOSURE_LENGTH;
}
