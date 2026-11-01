import { describe, expect, test } from "bun:test";

import { createSingleFlightSessionRefresh } from "../src/core/auth/admin_session_refresh";

describe("admin session refresh", () => {
  test("shares one rotating refresh request across concurrent callers", async () => {
    const pending = deferred<string | null>();
    let calls = 0;
    const refresh = createSingleFlightSessionRefresh(() => {
      calls += 1;
      return pending.promise;
    });

    const first = refresh();
    const second = refresh();

    expect(first).toBe(second);
    expect(calls).toBe(1);
    pending.resolve("new-access-token");
    expect(await Promise.all([first, second])).toEqual([
      "new-access-token",
      "new-access-token"
    ]);
  });

  test("starts a new refresh after the active request settles", async () => {
    let calls = 0;
    const refresh = createSingleFlightSessionRefresh(async () => {
      calls += 1;
      return `access-token-${calls}`;
    });

    expect(await refresh()).toBe("access-token-1");
    expect(await refresh()).toBe("access-token-2");
    expect(calls).toBe(2);
  });

  test("releases a failed refresh so a later request can recover", async () => {
    let calls = 0;
    const refresh = createSingleFlightSessionRefresh(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("temporary refresh failure");
      }
      return "recovered-access-token";
    });

    await expect(refresh()).rejects.toThrow("temporary refresh failure");
    expect(await refresh()).toBe("recovered-access-token");
    expect(calls).toBe(2);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}
