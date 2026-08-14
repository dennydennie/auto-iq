import { ValidationPipe } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateMeDto } from "./accounts.dto";

describe("UpdateMeDto", () => {
  it("accepts the complete mobile buyer-profile payload", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(mobileProfilePayload(), {
        type: "body",
        metatype: UpdateMeDto,
      }),
    ).resolves.toEqual(mobileProfilePayload());
  });

  it("accepts nullable fields so mobile users can clear preferences", async () => {
    const dto = plainToInstance(UpdateMeDto, nullableProfilePayload());

    await expect(validate(dto)).resolves.toEqual([]);
  });
});

function mobileProfilePayload() {
  return {
    fullName: "Tariro Moyo",
    city: "Harare",
    vehiclePurpose: "FAMILY",
    searchRadiusKm: 150,
    deliveryPreference: "EITHER",
    paymentPreference: "FINANCE",
    preferredFuelTypes: ["DIESEL", "HYBRID"],
    preferredTransmissions: ["AUTOMATIC"],
    minSeats: 7,
    maxMileageKm: 90000,
    yearMin: 2018,
    yearMax: 2026,
    budgetMin: 10000,
    budgetMax: 30000,
  };
}

function nullableProfilePayload() {
  return {
    vehiclePurpose: null,
    searchRadiusKm: null,
    deliveryPreference: null,
    paymentPreference: null,
    minSeats: null,
    maxMileageKm: null,
    yearMin: null,
    yearMax: null,
    budgetMin: null,
    budgetMax: null,
    businessName: null,
  };
}
