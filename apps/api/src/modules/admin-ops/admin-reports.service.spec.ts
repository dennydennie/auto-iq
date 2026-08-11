import { BadRequestException } from "@nestjs/common";
import { AdminReportsService } from "./admin-reports.service";

describe("AdminReportsService", () => {
  it("returns date-bounded operational metrics", async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ total: 8, active: 7, suspended: 1, verified: 6 }])
        .mockResolvedValueOnce([{ created: 5, submitted: 2, published: 2, sold: 1 }])
        .mockResolvedValueOnce([{ requested: 3, confirmed: 2, completed: 1, cancelled: 0 }])
        .mockResolvedValueOnce([{ queued: 1, sent: 8, failed: 1, deadLetter: 0 }])
        .mockResolvedValueOnce([{ retryAttempts: 2 }]),
    };
    const service = new AdminReportsService(dataSource as never);

    const report = await service.operations({
      from: "2026-08-01",
      to: "2026-08-10",
    });

    expect(report.range).toEqual({ from: "2026-08-01", to: "2026-08-10" });
    expect(report.users).toEqual({ total: 8, active: 7, suspended: 1, verified: 6 });
    expect(report.notifications.retryAttempts).toBe(2);
    expect(dataSource.query).toHaveBeenCalledTimes(5);
  });

  it("rejects report ranges longer than one year", async () => {
    const service = new AdminReportsService({ query: jest.fn() } as never);

    await expect(
      service.operations({ from: "2024-01-01", to: "2026-08-10" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
