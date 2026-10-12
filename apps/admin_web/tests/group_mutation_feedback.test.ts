import type { MinistryGroup } from "@mbc/api-contracts";
import { describe, expect, test } from "bun:test";
import { ref } from "vue";

import { useGroupMutationFeedback } from "../src/features/groups/composables/use_group_mutation_feedback";

describe("group mutation feedback", () => {
  test("ignores late results from a previously selected group", () => {
    const selectedGroup = ref<MinistryGroup | null>(group("group-a"));
    const successMessage = ref("old success");
    const feedback = useGroupMutationFeedback(
      selectedGroup,
      successMessage,
      (key) => key
    );
    const groupAContext = feedback.begin();

    feedback.capture(new Error("save failed"), undefined, groupAContext);
    expect(feedback.errorMessage.value).toBe("save failed");

    const newerGroupAContext = feedback.begin();
    feedback.capture(new Error("older failure"), undefined, groupAContext);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.succeed(newerGroupAContext, "newer success")).toBe(true);

    selectedGroup.value = group("group-b");
    feedback.reset();
    feedback.capture(new Error("late failure"), undefined, groupAContext);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.succeed(groupAContext, "late success")).toBe(false);
    expect(successMessage.value).toBe("");

    const groupBContext = feedback.begin();
    expect(feedback.succeed(groupBContext, "current success")).toBe(true);
    expect(successMessage.value).toBe("current success");
  });
});

function group(id: string): MinistryGroup {
  return {
    id,
    name: id,
    description: "",
    meetingTime: "",
    location: "",
    leaderName: "",
    visibility: "members",
    status: "active",
    capacity: null,
    memberCount: 0,
    myApplicationId: null,
    myApplicationStatus: null,
    myMembershipStatus: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z"
  };
}
