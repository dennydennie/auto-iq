import { ConsentService } from "./consent.service";

describe("ConsentService", () => {
  it("treats required buyer consents as complete only when all are accepted", () => {
    const service = new ConsentService({} as never, {} as never, {} as never);

    expect(service.isComplete(["BUYER"], [
      { consentType: "TERMS" },
      { consentType: "PRIVACY" },
      { consentType: "BUYER_RULES" },
      { consentType: "NO_SIDE_DEAL" },
    ])).toBe(true);

    expect(service.isComplete(["BUYER"], [
      { consentType: "TERMS" },
      { consentType: "PRIVACY" },
    ])).toBe(false);
  });
});
