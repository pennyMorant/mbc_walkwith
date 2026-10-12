import type { FastifyBaseLogger } from "fastify";

import type { NotificationService } from "./notification.service.js";

type RetryService = Pick<NotificationService, "retryDueDeliveries">;

export type NotificationRetrySchedulerOptions = {
  intervalMs: number;
  batchSize: number;
};

export class NotificationRetryScheduler {
  constructor(
    private readonly service: RetryService,
    private readonly logger: Pick<FastifyBaseLogger, "info" | "warn">,
    private readonly options: NotificationRetrySchedulerOptions
  ) {}

  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  start() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.runOnce();
    }, Math.max(this.options.intervalMs, 1000));
    this.timer.unref?.();
  }

  stop() {
    if (!this.timer) {
      return;
    }
    clearInterval(this.timer);
    this.timer = null;
  }

  async runOnce() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const results = await this.service.retryDueDeliveries(
        this.options.batchSize
      );
      if (results.length > 0) {
        this.logger.info(
          {
            processed: results.length,
            attempted: results.reduce((sum, result) => sum + result.attempted, 0),
            sent: results.reduce((sum, result) => sum + result.sent, 0),
            failed: results.reduce((sum, result) => sum + result.failed, 0)
          },
          "notification retry scheduler processed due deliveries"
        );
      }
    } catch (error) {
      this.logger.warn(
        { err: error },
        "notification retry scheduler failed"
      );
    } finally {
      this.running = false;
    }
  }
}
