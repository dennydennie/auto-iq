import { OwnershipVerificationService } from "./ownership-verification.service";

describe("OwnershipVerificationService", () => {
  const service = new OwnershipVerificationService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  it("allows NOT_STARTED to IN_REVIEW then APPROVED", () => {
    expect(service.transition("NOT_STARTED", "IN_REVIEW")).toBe("IN_REVIEW");
    expect(service.transition("IN_REVIEW", "APPROVED")).toBe("APPROVED");
  });

  it("allows NEEDS_CLARIFICATION back to IN_REVIEW", () => {
    expect(service.transition("NEEDS_CLARIFICATION", "IN_REVIEW")).toBe("IN_REVIEW");
  });

  it("rejects terminal transitions", () => {
    expect(() => service.transition("APPROVED", "IN_REVIEW")).toThrow(
      "Cannot move ownership verification from APPROVED to IN_REVIEW",
    );
  });
});
