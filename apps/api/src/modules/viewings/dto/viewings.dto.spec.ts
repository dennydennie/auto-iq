import { validateSync } from "class-validator";
import { RequestViewingDto } from "./viewings.dto";

describe("RequestViewingDto", () => {
  function dto(preferredTime: string) {
    const request = new RequestViewingDto();
    request.preferredDate = "2026-06-10";
    request.preferredTime = preferredTime;
    request.locationId = "location-1";
    return request;
  }

  it("accepts 24-hour HH:mm viewing times", () => {
    expect(validateSync(dto("23:59"))).toHaveLength(0);
  });

  it("rejects out-of-range viewing times", () => {
    expect(validateSync(dto("24:00"))).not.toHaveLength(0);
    expect(validateSync(dto("12:60"))).not.toHaveLength(0);
  });
});
