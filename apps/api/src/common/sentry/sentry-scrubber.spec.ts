import { scrubSentryEvent } from "./sentry-scrubber";

describe("scrubSentryEvent", () => {
  it("removes cookie and authorization headers from all events", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://api.example.com/api/v1/listings",
        cookies: { session: "secret" },
        headers: {
          Authorization: "Bearer token",
          Cookie: "session=secret",
          "X-CSRF-Token": "csrf-token",
        },
      },
    } as never);

    expect(event?.request?.cookies).toBeUndefined();
    expect(event?.request?.headers?.Authorization).toBeUndefined();
    expect(event?.request?.headers?.Cookie).toBeUndefined();
    expect(event?.request?.headers?.["X-CSRF-Token"]).toBeUndefined();
  });

  it("removes request bodies for auth and file routes", () => {
    const authEvent = scrubSentryEvent({
      request: {
        url: "https://api.example.com/api/v1/auth/login",
        data: { password: "LocalFixtureA9" },
      },
    } as never);
    const storageEvent = scrubSentryEvent({
      request: {
        url: "https://api.example.com/api/v1/storage/images/presign",
        data: { contentType: "image/jpeg" },
      },
    } as never);

    expect(authEvent?.request?.data).toBeUndefined();
    expect(storageEvent?.request?.data).toBeUndefined();
  });
});
