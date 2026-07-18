import { NotificationSchedulerService } from "./notification-scheduler.service";

describe("NotificationSchedulerService", () => {
  it("processes retries and reminders for every tenant", async () => {
    const notificationService = {
      processPendingRetries: jest.fn().mockResolvedValue(1),
      processViewingReminders: jest.fn().mockResolvedValue(2),
    };
    const tenantService = {
      forEachTenant: jest.fn(async (callback: (tenantId: string) => Promise<void>) => {
        await callback("tenant-1");
        await callback("tenant-2");
      }),
    };
    const service = new NotificationSchedulerService(
      { get: jest.fn() } as never,
      notificationService as never,
      tenantService as never,
    );

    await service["runTick"]();

    expect(tenantService.forEachTenant).toHaveBeenCalledTimes(1);
    expect(notificationService.processPendingRetries).toHaveBeenCalledTimes(2);
    expect(notificationService.processViewingReminders).toHaveBeenCalledTimes(2);
  });
});
