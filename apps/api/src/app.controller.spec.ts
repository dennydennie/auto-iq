import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  it("returns the API metadata response", () => {
    const controller = new AppController(
      new AppService(),
      { get: jest.fn().mockReturnValue(false) } as never,
    );

    expect(controller.getRoot()).toEqual({
      service: "auto-iq-api",
      version: "0.1.0",
      status: "bootstrapped",
    });
  });
});
