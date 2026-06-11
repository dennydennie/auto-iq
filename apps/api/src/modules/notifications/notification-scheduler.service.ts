import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationService } from "./notification.service";

@Injectable()
export class NotificationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    const intervalMs = Number(this.configService.get<string>("NOTIFICATION_REMINDER_INTERVAL_MS") ?? 0);
    if (intervalMs <= 0) {
      return;
    }

    this.timer = setInterval(() => {
      void this.runTick();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async runTick() {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      await this.notificationService.processPendingRetries();
      await this.notificationService.processViewingReminders();
    } finally {
      this.running = false;
    }
  }
}
