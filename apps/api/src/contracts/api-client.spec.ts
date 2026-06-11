import { ApiClient } from "../../../../packages/contracts/src/client";

describe("ApiClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("uses cookie credentials and csrf headers for unsafe requests", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    });
    const client = new ApiClient({
      baseUrl: "https://api.example.com",
      getCsrfToken: async () => "csrf-1",
    });

    await client.post("/api/v1/listings", { make: "Toyota" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/listings",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "X-CSRF-Token": "csrf-1",
        }),
      }),
    );
  });

  it("expands array query parameters for browse filters", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
      headers: new Headers(),
    });
    const client = new ApiClient({ baseUrl: "https://api.example.com" });

    await client.get("/api/v1/listings", { make: ["Toyota", "Honda"], yearMin: 2020 }, true);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/listings?make=Toyota&make=Honda&yearMin=2020",
      expect.any(Object),
    );
  });
});
