import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CatalogueQueryDto } from "./catalogue.dto";

describe("CatalogueQueryDto", () => {
  it("accepts a bounded full-catalogue search query", async () => {
    const query = plainToInstance(CatalogueQueryDto, { query: "Toyota Hilux" });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it("rejects one-character and oversized catalogue searches", async () => {
    const short = plainToInstance(CatalogueQueryDto, { query: "x" });
    const long = plainToInstance(CatalogueQueryDto, { query: "x".repeat(121) });

    expect(JSON.stringify(await validate(short))).toContain("query");
    expect(JSON.stringify(await validate(long))).toContain("query");
  });

  it("accepts an inclusive year range", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      yearMin: "2018",
      yearMax: "2024",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it("rejects a minimum year above the maximum", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      yearMin: "2025",
      yearMax: "2020",
    });

    expect(JSON.stringify(await validate(query))).toContain(
      "Minimum year cannot exceed maximum year",
    );
  });

  it("rejects years outside the supported API bounds", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      yearMin: "1899",
      yearMax: "2101",
    });

    const errors = JSON.stringify(await validate(query));
    expect(errors).toContain("yearMin");
    expect(errors).toContain("yearMax");
  });

  it("accepts an inclusive price range", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      priceMin: "5000",
      priceMax: "20000",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it("rejects a minimum price above the maximum", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      priceMin: "30000",
      priceMax: "20000",
    });

    expect(JSON.stringify(await validate(query))).toContain(
      "Minimum price cannot exceed maximum price",
    );
  });

  it("rejects negative price bounds", async () => {
    const query = plainToInstance(CatalogueQueryDto, {
      priceMin: "-1",
      priceMax: "10000",
    });

    expect(JSON.stringify(await validate(query))).toContain("priceMin");
  });

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
