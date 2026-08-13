import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CatalogueQueryDto } from "./catalogue.dto";

describe("CatalogueQueryDto", () => {
  it("accepts an inclusive mileage range", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      mileageMin: "40000",
      mileageMax: "100000",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it("rejects a minimum mileage above the maximum", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      mileageMin: "150000",
      mileageMax: "100000",
    });

    const errors = await validate(query);

    expect(JSON.stringify(errors)).toContain(
      "Minimum mileage cannot exceed maximum mileage",
    );
  });

  it("rejects negative mileage bounds", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      mileageMin: "-1",
      mileageMax: "100000",
    });

    expect(JSON.stringify(await validate(query))).toContain("mileageMin");
  });
});
