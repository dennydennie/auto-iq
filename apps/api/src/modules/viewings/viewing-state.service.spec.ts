import { ViewingStateService } from "./viewing-state.service";

describe("ViewingStateService", () => {
  const service = new ViewingStateService();

  it("confirms a requested viewing", () => {
    expect(service.confirm("REQUESTED")).toBe("CONFIRMED");
  });

  it("confirms a rescheduled viewing", () => {
    expect(service.confirm("RESCHEDULED")).toBe("CONFIRMED");
  });

  it("confirms after seller acknowledgement", () => {
    expect(service.confirm("PENDING_SELLER_CONFIRMATION")).toBe("CONFIRMED");
  });

  it("rejects confirmation from a terminal state", () => {
    expect(() => service.confirm("CANCELLED")).toThrow(
      "Cannot move viewing from CANCELLED to CONFIRMED",
    );
  });

  it("allows the seller to confirm only requested viewings", () => {
    expect(service.sellerConfirm("REQUESTED")).toBe("PENDING_SELLER_CONFIRMATION");
    expect(() => service.sellerConfirm("CANCELLED")).toThrow(
      "Cannot move viewing from CANCELLED to PENDING_SELLER_CONFIRMATION",
    );
  });

  it("reschedules a confirmed viewing", () => {
    expect(service.reschedule("CONFIRMED")).toBe("RESCHEDULED");
  });

  it("rejects invalid completion transitions", () => {
    expect(() => service.complete("REQUESTED", "COMPLETED")).toThrow(
      "Cannot move viewing from REQUESTED to COMPLETED",
    );
  });
});
