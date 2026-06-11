import { QuotesService } from "./quotes.service";

describe("QuotesService", () => {
  it("allows NEW to UNDER_REVIEW to ACCEPTED", () => {
    const service = new QuotesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(service.transition("NEW", "UNDER_REVIEW")).toBe("UNDER_REVIEW");
    expect(service.transition("UNDER_REVIEW", "ACCEPTED")).toBe("ACCEPTED");
  });

  it("requires a valid quote transition", () => {
    const service = new QuotesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(() => service.transition("ACCEPTED", "UNDER_REVIEW")).toThrow(
      "Cannot move quote from ACCEPTED to UNDER_REVIEW",
    );
  });
});
