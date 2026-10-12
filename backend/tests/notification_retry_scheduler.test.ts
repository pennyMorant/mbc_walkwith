import { describe, expect, it } from "vitest";

import { NotificationRetryScheduler } from "../src/modules/notifications/notification_retry_scheduler.js";

describe("notification retry scheduler", () => {
  it("runs due notification retries with the configured batch size", async () => {
    const service = new RecordingRetryService();
    const scheduler = new NotificationRetryScheduler(service, testLogger, {
      intervalMs: 60000,
      batchSize: 7
    });

    await scheduler.runOnce();

    expect(service.calls).toBe(1);
    expect(service.limits).toEqual([7]);
  });

  it("skips overlapping retry runs", async () => {
    const service = new RecordingRetryService({ wait: true });
    const scheduler = new NotificationRetryScheduler(service, testLogger, {
      intervalMs: 60000,
      batchSize: 3
    });

    const firstRun = scheduler.runOnce();
    await scheduler.runOnce();
    service.release();
    await firstRun;

    expect(service.calls).toBe(1);
  });
});

class RecordingRetryService {
  constructor(private readonly options: { wait?: boolean } = {}) {}

  calls = 0;
  limits: number[] = [];
  private releaseWaiter: (() => void) | null = null;

  async retryDueDeliveries(limit: number) {
    this.calls += 1;
    this.limits.push(limit);
    if (this.options.wait) {
      await new Promise<void>((resolve) => {
        this.releaseWaiter = resolve;
      });
    }
    return [];
  }

  release() {
    this.releaseWaiter?.();
  }
}

const testLogger = {
  info(..._args: unknown[]) {},
  warn(..._args: unknown[]) {}
};
