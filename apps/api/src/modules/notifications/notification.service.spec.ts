import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  function createService(providerImpl: { send: jest.Mock }, viewingRepository = { findRemindersDue: jest.fn().mockResolvedValue([]) }) {
    const notifications = new Map<string, any>();
    const byKey = new Map<string, string>();
    const attemptsByNotification = new Map<string, any[]>();
    let sequence = 1;

    const notificationRepository = {
      create: jest.fn().mockImplementation((input) => input),
      save: jest.fn().mockImplementation(async (notification) => {
        const id = notification.id ?? `notification-${sequence++}`;
        const current = notifications.get(id) ?? {};
        const saved = {
          createdAt: current.createdAt ?? new Date("2026-06-09T08:00:00.000Z"),
          updatedAt: new Date("2026-06-09T08:05:00.000Z"),
          attempts: attemptsByNotification.get(id) ?? [],
          recipient: current.recipient ?? { fullName: "Recipient" },
          ...current,
          ...notification,
          id,
        };
        notifications.set(id, saved);
        byKey.set(`${saved.recipientUserId}:${saved.channel}:${saved.idempotencyKey}`, id);
        return saved;
      }),
      findByIdempotency: jest.fn().mockImplementation(async (recipientUserId, channel, idempotencyKey) => {
        const id = byKey.get(`${recipientUserId}:${channel}:${idempotencyKey}`);
        return id ? notifications.get(id) : null;
      }),
      findByIdWithRelations: jest.fn().mockImplementation(async (id) => {
        const notification = notifications.get(id);
        if (!notification) {
          return null;
        }
        return {
          ...notification,
          attempts: attemptsByNotification.get(id) ?? [],
          recipient: { fullName: "Recipient" },
        };
      }),
      claimById: jest.fn().mockImplementation(async (id, _now, token) => {
        const notification = notifications.get(id);
        if (!notification) return null;
        notifications.set(id, { ...notification, claimToken: token });
        return token;
      }),
      findAdminPage: jest.fn(),
      findRetryable: jest.fn().mockImplementation(async () =>
        [...notifications.values()].filter((notification) => notification.status === "FAILED"),
      ),
      updateDeliveryState: jest.fn().mockImplementation(async (id, state) => {
        const current = notifications.get(id);
        notifications.set(id, { ...current, ...state });
      }),
    };

    const notificationAttemptRepository = {
      create: jest.fn().mockImplementation((input) => input),
      save: jest.fn().mockImplementation(async (attempt) => {
        const current = attemptsByNotification.get(attempt.notificationId) ?? [];
        const saved = {
          id: attempt.id ?? `attempt-${current.length + 1}`,
          createdAt: new Date("2026-06-09T08:05:00.000Z"),
          ...attempt,
        };
        current.push(saved);
        attemptsByNotification.set(attempt.notificationId, current);
        return saved;
      }),
    };

    return new NotificationService(
      { record: jest.fn(), recordAdminAction: jest.fn() } as never,
      { get: jest.fn().mockReturnValue(undefined) } as never,
      notificationAttemptRepository as never,
      notificationRepository as never,
      providerImpl as never,
      viewingRepository as never,
    );
  }

  it("suppresses duplicate sends for the same idempotency key", async () => {
    const provider = { send: jest.fn().mockResolvedValue({ providerRef: "sandbox:1" }) };
    const service = createService(provider);

    await service.send({
      recipientUserId: "user-1",
      channel: "EMAIL",
      template: "VIEWING_CONFIRMED",
      idempotencyKey: "viewing:1",
      payload: {},
      recipientAddress: "test@example.com",
    });
    await service.send({
      recipientUserId: "user-1",
      channel: "EMAIL",
      template: "VIEWING_CONFIRMED",
      idempotencyKey: "viewing:1",
      payload: {},
      recipientAddress: "test@example.com",
    });

    expect(provider.send).toHaveBeenCalledTimes(1);
  });

  it("records a failed attempt and retries successfully", async () => {
    const provider = {
      send: jest.fn()
        .mockRejectedValueOnce(new Error("provider down"))
        .mockResolvedValueOnce({ providerRef: "sandbox:2" }),
    };
    const service = createService(provider);

    const first = await service.send({
      recipientUserId: "user-2",
      channel: "SMS",
      template: "OTP_VERIFY",
      idempotencyKey: "otp:1",
      payload: {},
      recipientAddress: "+263777123456",
    });
    expect(first.status).toBe("FAILED");
    expect(first.attemptCount).toBe(1);

    const second = await service.retry(first.id, "admin-1");

    expect(provider.send).toHaveBeenCalledTimes(2);
    expect(second.status).toBe("SENT");
    expect(second.attemptCount).toBe(2);
  });

  it("keeps viewing reminders idempotent across scheduler ticks", async () => {
    const provider = { send: jest.fn().mockResolvedValue({ providerRef: "sandbox:reminder" }) };
    const viewing = {
      id: "viewing-1",
      listingId: "listing-1",
      confirmedSlot: new Date("2026-06-10T08:00:00.000Z"),
      location: { name: "Auto IQ Yard" },
      buyer: { id: "buyer-1", email: "buyer@example.com", phone: "+263771111111" },
      seller: { id: "seller-1", email: "seller@example.com", phone: "+263772222222" },
    };
    const viewingRepository = {
      findRemindersDue: jest.fn()
        .mockResolvedValueOnce([viewing])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([viewing])
        .mockResolvedValueOnce([]),
    };
    const service = createService(provider, viewingRepository);

    await service.processViewingReminders(new Date("2026-06-09T08:00:00.000Z"));
    await service.processViewingReminders(new Date("2026-06-09T08:00:00.000Z"));

    expect(provider.send).toHaveBeenCalledTimes(4);
    expect(viewingRepository.findRemindersDue).toHaveBeenCalledTimes(4);
  });
});
