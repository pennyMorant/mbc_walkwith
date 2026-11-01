import { afterAll, describe, expect, mock, test } from "bun:test";
import { effectScope, nextTick, reactive } from "vue";

const route = reactive<{ query: { open?: string } }>({ query: {} });

mock.module("vue-router", () => ({
  useRoute: () => route
}));

const { useAdminResourceDeepLink } = await import(
  "../src/core/navigation/use_admin_resource_deep_link"
);

describe("admin resource deep links", () => {
  test("invalidates an in-flight detail when the open query is cleared", async () => {
    const request = deferred<{ id: string }>();
    const opened: string[] = [];
    route.query.open = "  member-1  ";

    const scope = effectScope();
    const state = scope.run(() =>
      useAdminResourceDeepLink(
        async (id) => {
          expect(id).toBe("member-1");
          return request.promise;
        },
        (resource) => opened.push(resource.id)
      )
    )!;

    expect(state.pending.value).toBe(true);
    delete route.query.open;
    await nextTick();
    expect(state.pending.value).toBe(false);

    request.resolve({ id: "member-1" });
    await flushPromises();
    expect(opened).toEqual([]);
    expect(state.pending.value).toBe(false);
    scope.stop();
  });

  test("opens only the latest resource when query targets change quickly", async () => {
    const first = deferred<{ id: string }>();
    const second = deferred<{ id: string }>();
    const opened: string[] = [];
    route.query.open = "sermon-1";

    const scope = effectScope();
    const state = scope.run(() =>
      useAdminResourceDeepLink(
        (id) => (id === "sermon-1" ? first.promise : second.promise),
        (resource) => opened.push(resource.id)
      )
    )!;

    route.query.open = "sermon-2";
    await nextTick();
    first.resolve({ id: "sermon-1" });
    second.resolve({ id: "sermon-2" });
    await flushPromises();

    expect(opened).toEqual(["sermon-2"]);
    expect(state.pending.value).toBe(false);
    expect(state.error.value).toBeNull();
    scope.stop();
  });

  test("does not apply a resource after its owner scope is disposed", async () => {
    const request = deferred<{ id: string }>();
    const opened: string[] = [];
    route.query.open = "life-1";
    const scope = effectScope();
    scope.run(() =>
      useAdminResourceDeepLink(
        () => request.promise,
        (resource) => opened.push(resource.id)
      )
    );

    scope.stop();
    request.resolve({ id: "life-1" });
    await flushPromises();

    expect(opened).toEqual([]);
  });
});

afterAll(() => {
  mock.restore();
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

async function flushPromises() {
  await Promise.resolve();
  await nextTick();
}
