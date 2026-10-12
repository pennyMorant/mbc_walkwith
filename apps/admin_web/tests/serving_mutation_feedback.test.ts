import { describe, expect, test } from "bun:test";
import { ref } from "vue";

import { useServingMutationFeedback } from "../src/features/serving/composables/use_serving_mutation_feedback";

describe("serving mutation feedback", () => {
  test("keeps form ownership scoped and feedback owned by the latest command", () => {
    const successMessage = ref("");
    const feedback = useServingMutationFeedback(successMessage, (key) => key);
    const oldTeam = feedback.begin("team-create");
    const assignment = feedback.begin("assignment-create");

    expect(feedback.isCurrent(oldTeam)).toBe(true);
    expect(feedback.isCurrent(assignment)).toBe(true);
    feedback.capture(new Error("older team error"), undefined, oldTeam);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.succeed(oldTeam, "older team success")).toBe(false);
    expect(feedback.succeed(assignment, "assignment created")).toBe(true);
    expect(successMessage.value).toBe("assignment created");

    const newTeam = feedback.begin("team-create");
    feedback.capture(new Error("late team error"), undefined, oldTeam);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.isCurrent(oldTeam)).toBe(false);
    expect(feedback.succeed(oldTeam, "late success")).toBe(false);
    expect(feedback.succeed(newTeam, "team created")).toBe(true);
    expect(successMessage.value).toBe("team created");
  });
});
