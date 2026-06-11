import { ListingWizardValidator } from "./listing-wizard.validator";

describe("ListingWizardValidator", () => {
  it("fails when photos, documents, price, and disclosure are missing", () => {
    const validator = new ListingWizardValidator();

    expect(() =>
      validator.validateForSubmit({
        specs: {
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
        },
        pricing: null,
        images: [],
        documents: [],
      } as never, ""),
    ).toThrow("Listing wizard is incomplete");
  });
});
