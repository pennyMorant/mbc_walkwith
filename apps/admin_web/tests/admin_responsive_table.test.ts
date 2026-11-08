import { describe, expect, test } from "bun:test";

const shell = await Bun.file(
  new URL("../src/core/ui/AdminResponsiveTable.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "courses/components/CourseEnrollmentsPanel.vue",
    "giving/components/GivingProviderEventsCard.vue",
    "giving/components/GivingStatementsCard.vue",
    "giving/components/GivingTransactionsCard.vue",
    "reading-plans/components/ReadingPlanAssignmentsPanel.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);
const courseActions = await Bun.file(
  new URL(
    "../src/features/courses/components/CourseEnrollmentActions.vue",
    import.meta.url
  )
).text();
const givingStatements = await Bun.file(
  new URL(
    "../src/features/giving/components/GivingStatementsCard.vue",
    import.meta.url
  )
).text();

describe("admin responsive table", () => {
  test("owns only desktop and mobile projection visibility", () => {
    expect(shell).toContain('<slot name="desktop"');
    expect(shell).toContain('<slot name="mobile"');
    expect(shell).toContain("@media (max-width: 959px)");
    expect(shell).not.toContain("fetch(");
    expect(shell).not.toContain("useQuery");
  });

  test("is shared by operational tables without moving feature state", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminResponsiveTable");
      expect(source).toContain("#desktop");
      expect(source).toContain("#mobile");
    }
  });

  test("scopes command loading to the active record", () => {
    expect(courseActions).toContain("pendingEnrollmentId === props.enrollment.id");
    expect(courseActions).toContain("pendingEnrollmentStatus === status");
    expect(givingStatements).toContain(
      "isDownloadingStatement && downloadingStatementId === statement.id"
    );
  });
});
