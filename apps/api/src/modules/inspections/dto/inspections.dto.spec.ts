import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SubmitInspectionReportDto } from "./inspections.dto";

describe("SubmitInspectionReportDto", () => {
  it("validates every nested inspection finding", async () => {
    const payload = plainToInstance(SubmitInspectionReportDto, {
      findings: [{ category: "UNKNOWN", label: "Unsafe input", rating: "PASS" }],
      inspectorNote: "Complete report",
      roadworthy: true,
    });

    const errors = await validate(payload);

    expect(JSON.stringify(errors)).toContain("category");
  });

  it("requires the fixed six-category checklist and visible text", async () => {
    const payload = plainToInstance(SubmitInspectionReportDto, {
      findings: [{ category: "ENGINE", label: "   ", rating: "PASS" }],
      inspectorNote: "   ",
      roadworthy: true,
    });

    const errors = await validate(payload);
    const detail = JSON.stringify(errors);

    expect(detail).toContain("arrayMinSize");
    expect(detail).toContain("visible text");
  });
});
