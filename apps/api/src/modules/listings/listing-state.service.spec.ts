import { ListingStateService } from "./listing-state.service";

describe("ListingStateService", () => {
  const service = new ListingStateService();

  it("allows DRAFT to SUBMITTED", () => {
    expect(service.transitionForSeller("DRAFT", "SUBMITTED")).toBe("SUBMITTED");
  });

  it("rejects SUBMITTED back to DRAFT", () => {
    expect(() => service.assertEditable("SUBMITTED")).toThrow("This listing can no longer be edited");
  });

  it("rejects seller publish transitions", () => {
    expect(() => service.transitionForSeller("SUBMITTED", "PUBLISHED")).toThrow(
      "Seller cannot transition listing to PUBLISHED",
    );
  });

  it("requires APPROVED before publish", () => {
    expect(() => service.publish("SUBMITTED")).toThrow("Cannot move listing from SUBMITTED to PUBLISHED");
    expect(service.publish("APPROVED")).toBe("PUBLISHED");
  });

  it("allows reject from submitted", () => {
    expect(service.reject("SUBMITTED")).toBe("REJECTED");
  });
});
