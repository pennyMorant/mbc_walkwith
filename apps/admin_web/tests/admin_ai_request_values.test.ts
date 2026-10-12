import { describe, expect, test } from "bun:test";
import { aiTaskInputLimits } from "@mbc/api-contracts";

import {
  adminAiRequestIdentity,
  beginAdminAiRequest,
  createAdminAiRequestState,
  hasAdminAiTaskInput,
  invalidateAdminAiRequest,
  isAdminAiRequestPending,
  isCurrentAdminAiDraftResult,
  prepareAdminAiTaskInput,
  settleAdminAiRequest
} from "../src/features/ai/admin_ai_request_values";

describe("admin AI request values", () => {
  test("bounds long sermon content to the shared API contract", () => {
    const prepared = prepareAdminAiTaskInput({
      title: "T".repeat(aiTaskInputLimits.title + 20),
      body: "讲".repeat(aiTaskInputLimits.body + 500),
      context: Array.from(
        { length: aiTaskInputLimits.contextItems + 3 },
        (_, index) => ({
          label: `Context ${index}`,
          value: "😀".repeat(aiTaskInputLimits.contextValue)
        })
      )
    });

    expect(prepared.title?.length).toBeLessThanOrEqual(
      aiTaskInputLimits.title
    );
    expect(prepared.body?.length).toBeLessThanOrEqual(aiTaskInputLimits.body);
    expect(prepared.body).toEndWith("[Context excerpt truncated]");
    expect(prepared.context).toHaveLength(aiTaskInputLimits.contextItems);
    expect(
      prepared.context.every(
        (item) => item.value.length <= aiTaskInputLimits.contextValue
      )
    ).toBe(true);
    const firstContextValue = prepared.context[0]?.value ?? "";
    const noticeIndex = firstContextValue.indexOf(
      "\n\n[Context excerpt truncated]"
    );
    expect(noticeIndex).toBeGreaterThan(0);
    expect(firstContextValue.charCodeAt(noticeIndex - 1)).toBeGreaterThanOrEqual(
      0xdc00
    );
    expect(firstContextValue.charCodeAt(noticeIndex - 1)).toBeLessThanOrEqual(
      0xdfff
    );
  });

  test("drops blank fields and detects meaningful input", () => {
    const prepared = prepareAdminAiTaskInput({
      title: " ",
      body: " ",
      context: [
        { label: "Blank", value: " " },
        { label: "Speaker", value: " Pastor Lee " }
      ]
    });

    expect(prepared).toEqual({
      context: [{ label: "Speaker", value: "Pastor Lee" }]
    });
    expect(hasAdminAiTaskInput(prepared)).toBe(true);
    expect(hasAdminAiTaskInput({ context: [] })).toBe(false);
  });

  test("request identity changes with source content and resource", () => {
    const base = {
      task: "sermon_summary" as const,
      locale: "en" as const,
      taskInput: { title: "Sunday", context: [] }
    };

    expect(adminAiRequestIdentity(base)).not.toBe(
      adminAiRequestIdentity({
        ...base,
        taskInput: { title: "Sunday updated", context: [] }
      })
    );
    expect(adminAiRequestIdentity(base)).not.toBe(
      adminAiRequestIdentity({
        ...base,
        resource: { resourceType: "sermon", resourceId: "sermon-1" }
      })
    );
  });

  test("accepts only the response for the current request", () => {
    const current = {
      responseTask: "sermon_summary" as const,
      activeTask: "sermon_summary" as const,
      responseIdentity: "current",
      activeIdentity: "current",
      responseSerial: 3,
      activeSerial: 3
    };

    expect(isCurrentAdminAiDraftResult(current)).toBe(true);
    expect(
      isCurrentAdminAiDraftResult({ ...current, responseSerial: 2 })
    ).toBe(false);
    expect(
      isCurrentAdminAiDraftResult({ ...current, responseIdentity: "stale" })
    ).toBe(false);
    expect(
      isCurrentAdminAiDraftResult({
        ...current,
        responseTask: "sermon_outline"
      })
    ).toBe(false);
  });

  test("keeps a stale provider request pending until it settles", () => {
    const started = beginAdminAiRequest(createAdminAiRequestState());
    expect(started).not.toBeNull();
    if (!started) {
      throw new Error("request did not start");
    }
    expect(isAdminAiRequestPending(started.state)).toBe(true);

    const invalidated = invalidateAdminAiRequest(started.state);
    expect(invalidated.serial).toBe(started.serial + 1);
    expect(invalidated.pendingSerial).toBe(started.serial);
    expect(beginAdminAiRequest(invalidated)).toBeNull();

    const settled = settleAdminAiRequest(invalidated, started.serial);
    expect(isAdminAiRequestPending(settled)).toBe(false);
    const restarted = beginAdminAiRequest(settled);
    expect(restarted?.serial).toBe(invalidated.serial + 1);
  });
});
