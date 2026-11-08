import { describe, expect, test } from "bun:test";

const toolbar = await Bun.file(
  new URL("../src/core/ui/AdminFilterToolbar.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "courses/components/CourseEnrollmentsPanel.vue",
    "discipleship/components/DiscipleshipAssignmentsPanel.vue",
    "giving/components/GivingProviderEventsCard.vue",
    "giving/components/GivingReconciliationCard.vue",
    "giving/components/GivingStatementsCard.vue",
    "reading-plans/components/ReadingPlanAssignmentsPanel.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin filter toolbar", () => {
  test("owns responsive filter layout without query state", () => {
    expect(toolbar).toContain("@submit.prevent");
    expect(toolbar).toContain("$emit('apply')");
    expect(toolbar).toContain('<slot name="heading"');
    expect(toolbar).toContain('<slot name="actions"');
    expect(toolbar).toContain("admin-filter-control");
    expect(toolbar).toContain("@media (min-width: 600px)");
    expect(toolbar).toContain("@media (min-width: 1280px)");
    expect(toolbar).not.toContain("defineModel");
    expect(toolbar).not.toContain("@/core/api");
  });

  test("is reused by feature-owned filter intents", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminFilterToolbar");
      expect(source).toContain('@apply="');
      expect(source).toContain("admin-filter-control");
    }
  });

  test("keeps filter actions in Core instead of feature-local copies", async () => {
    const givingActions = await Promise.all(
      [
        "GivingFundsCard.vue",
        "GivingProviderEventsCard.vue",
        "GivingReconciliationCard.vue",
        "GivingStatementsCard.vue",
        "GivingTransactionsCard.vue"
      ].map((file) =>
        Bun.file(
          new URL(`../src/features/giving/components/${file}`, import.meta.url)
        ).text()
      )
    );
    const removedCopy = Bun.file(
      new URL(
        "../src/features/giving/components/GivingFilterActions.vue",
        import.meta.url
      )
    );

    for (const source of givingActions) {
      expect(source).toContain("AdminFilterActions");
      expect(source).not.toContain("GivingFilterActions");
    }
    expect(await removedCopy.exists()).toBe(false);
  });
});
