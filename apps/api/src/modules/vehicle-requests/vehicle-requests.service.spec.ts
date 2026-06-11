import { VehicleRequestsService } from "./vehicle-requests.service";

describe("VehicleRequestsService", () => {
  it("allows NEW vehicle requests to move into sourcing", () => {
    const service = new VehicleRequestsService(
      {} as never,
      {} as never,
      { getAll: jest.fn().mockReturnValue({ makes: [] }) } as never,
      {} as never,
      {} as never,
    );

    expect(service.transition("NEW", "SOURCING")).toBe("SOURCING");
  });
});
