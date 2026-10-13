import { DELIVERY_MESSAGES, PUBLIC_SERVER_ERRORS, getPublicServerError } from "./public-server-errors";

describe("Preserved delivery errors", () => {
  it("retains the production verification and password-reset messages", () => {
    for (const message of Object.values(DELIVERY_MESSAGES)) {
      expect(getPublicServerError("DELIVERY_UNAVAILABLE", message)).toEqual({ code: "DELIVERY_UNAVAILABLE", message });
    }
  });
  it("never exposes an arbitrary provider error as a public message", () => {
    expect(getPublicServerError("DELIVERY_UNAVAILABLE", "private vendor payload")).toEqual(PUBLIC_SERVER_ERRORS.DELIVERY_UNAVAILABLE);
    expect(getPublicServerError("UNRECOGNISED_CODE", "private vendor payload")).toBeUndefined();
  });
});
