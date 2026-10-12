import { describe, expect, test } from "bun:test";

import {
  formatDashboardMetricValue,
  formatDashboardTimestamp
} from "../src/features/dashboard/dashboard_presenters";

describe("dashboard presenters", () => {
  test("formats count and currency metrics from contract metadata", () => {
    expect(
      formatDashboardMetricValue(
        {
          id: "registrations",
          labelKey: "dashboard.metric.registrations",
          value: 1234,
          tone: "info",
          format: "count",
          currency: null,
          path: "/life-posts"
        },
        "en"
      )
    ).toBe("1,234");
    expect(
      formatDashboardMetricValue(
        {
          id: "giving",
          labelKey: "dashboard.metric.giving",
          value: 123456,
          tone: "success",
          format: "currency",
          currency: "USD",
          path: "/giving"
        },
        "en-US"
      )
    ).toBe("$1,234.56");
  });

  test("formats snapshot timestamps for the active locale", () => {
    expect(
      formatDashboardTimestamp("2026-07-13T12:00:00.000Z", "en-US")
    ).toContain("2026");
  });
});
