import { ListingWizardValidator } from "./listing-wizard.validator";

const baseSpecs = {
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  bodyType: "BAKKIE",
  colour: "White",
  fuelType: "DIESEL",
  transmission: "MANUAL",
  driveType: "4WD",
  engineCapacity: "2.8L",
  mileageKm: 120_000,
  condition: "GOOD",
  hasAccidentHistory: false,
  accidentNote: null,
};

const basePricing = { askPriceUsd: 22000, negotiable: true };

const validDisclosure =
  "Fully serviced, new tyres last month, clean interior throughout.";

function makeImage(index: number, isCover = false) {
  return {
    id: `image-${index}`,
    slot: index === 0 ? "FRONT_THREE_QUARTER" : "DRIVER_SIDE",
    storageKey: `key-${index}`,
    isCover,
    uploadedAt: new Date(),
  };
}

function makeDocument(documentType: string) {
  return {
    id: `doc-${documentType}`,
    documentType,
    storageKey: `doc-key-${documentType}`,
    reviewStatus: "PENDING",
    uploadedAt: new Date(),
  };
}

function makeRequiredDocuments() {
  return ["REGISTRATION_BOOK", "SELLER_ID", "PURCHASE_IMPORT_DOCS"].map(
    makeDocument,
  );
}

describe("ListingWizardValidator", () => {
  const validator = new ListingWizardValidator();

  it("fails when photos, documents, price, and disclosure are missing", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: null,
          images: [],
          documents: [],
        } as never,
        "",
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when only one photo is uploaded (below 3-photo minimum)", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0, true)],
          documents: makeRequiredDocuments(),
        } as never,
        validDisclosure,
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when three photos are uploaded but none marked as cover", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0), makeImage(1), makeImage(2)],
          documents: makeRequiredDocuments(),
        } as never,
        validDisclosure,
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when disclosure is shorter than the minimum length", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0, true), makeImage(1), makeImage(2)],
          documents: makeRequiredDocuments(),
        } as never,
        "Great car",
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when one mandatory document type is missing", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0, true), makeImage(1), makeImage(2)],
          documents: makeRequiredDocuments().slice(0, 2),
        } as never,
        validDisclosure,
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("does not accept optional documents in place of mandatory documents", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0, true), makeImage(1), makeImage(2)],
          documents: [makeDocument("INSURANCE_CERTIFICATE")],
        } as never,
        validDisclosure,
      ),
    ).toThrow("Listing wizard is incomplete");
  });

  it("passes with specs, pricing, photos, mandatory documents, and disclosure", () => {
    expect(() =>
      validator.validateForSubmit(
        {
          specs: baseSpecs,
          pricing: basePricing,
          images: [makeImage(0, true), makeImage(1), makeImage(2)],
          documents: makeRequiredDocuments(),
        } as never,
        validDisclosure,
      ),
    ).not.toThrow();
  });
});
