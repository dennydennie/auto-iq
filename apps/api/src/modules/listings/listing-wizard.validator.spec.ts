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

function makeDocument() {
  return {
    id: "doc-1",
    documentType: "REGISTRATION",
    storageKey: "doc-key",
    reviewStatus: "PENDING",
    uploadedAt: new Date(),
  };
}

describe("ListingWizardValidator", () => {
  const validator = new ListingWizardValidator();

  it("fails when photos, documents, price, and disclosure are missing", () => {
    expect(() =>
      validator.validateForSubmit({
        specs: baseSpecs,
        pricing: null,
        images: [],
        documents: [],
      } as never, ""),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when only one photo is uploaded (below 3-photo minimum)", () => {
    expect(() =>
      validator.validateForSubmit({
        specs: baseSpecs,
        pricing: basePricing,
        images: [makeImage(0, true)],
        documents: [makeDocument()],
      } as never, validDisclosure),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when three photos are uploaded but none marked as cover", () => {
    expect(() =>
      validator.validateForSubmit({
        specs: baseSpecs,
        pricing: basePricing,
        images: [makeImage(0), makeImage(1), makeImage(2)],
        documents: [makeDocument()],
      } as never, validDisclosure),
    ).toThrow("Listing wizard is incomplete");
  });

  it("fails when disclosure is shorter than the minimum length", () => {
    expect(() =>
      validator.validateForSubmit({
        specs: baseSpecs,
        pricing: basePricing,
        images: [makeImage(0, true), makeImage(1), makeImage(2)],
        documents: [makeDocument()],
      } as never, "Great car"),
    ).toThrow("Listing wizard is incomplete");
  });

  it("passes when specs, pricing, 3 photos with cover, 1 doc, and a full disclosure are present", () => {
    expect(() =>
      validator.validateForSubmit({
        specs: baseSpecs,
        pricing: basePricing,
        images: [makeImage(0, true), makeImage(1), makeImage(2)],
        documents: [makeDocument()],
      } as never, validDisclosure),
    ).not.toThrow();
  });
});
