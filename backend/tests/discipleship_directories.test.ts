import { describe, expect, it } from "vitest";

import {
  RepositoryDiscipleshipReferenceDirectory,
  RepositoryDiscipleshipSourceDirectory
} from "../src/modules/discipleship/discipleship_directories.js";

describe("discipleship directories", () => {
  it("resolves every task reference through its owning repository", async () => {
    const ids: string[] = [];
    const byId = { getById: async (id: string) => record(ids, id) };
    const directory = new RepositoryDiscipleshipReferenceDirectory(
      { getPlanById: async (id) => record(ids, id) },
      byId,
      { getGuideById: async (id) => record(ids, id) },
      byId,
      {
        getApplicationById: async (groupId, applicationId) =>
          record(ids, `${groupId}:${applicationId}`)
      },
      { getAssignmentById: async (id) => record(ids, id) },
      {
        getRegistrationById: async (lifePostId, registrationId) =>
          record(ids, `${lifePostId}:${registrationId}`)
      },
      byId
    );

    for (const type of [
      "reading_plan",
      "sermon",
      "sermon_discussion_guide",
      "course",
      "serving_assignment",
      "care_request"
    ] as const) {
      expect(await directory.exists(type, "known")).toBe(true);
    }
    expect(await directory.exists("group_application", "group:known")).toBe(
      true
    );
    expect(
      await directory.exists("event_registration", "event:known")
    ).toBe(true);
    expect(await directory.exists("group_application", "invalid")).toBe(false);
    expect(await directory.exists("sermon", "missing")).toBe(false);
  });

  it("validates member and newcomer assignment sources independently", async () => {
    const directory = new RepositoryDiscipleshipSourceDirectory(
      { getById: async (id) => (id === "member_1" ? {} : null) },
      { getById: async (id) => (id === "newcomer_1" ? {} : null) }
    );

    expect(
      await directory.exists({
        journeyId: "00000000-0000-4000-8000-000000000001",
        userId: "member_1",
        sourceType: "member",
        sourceId: null,
        assigneeAdminUserId: null,
        assigneeName: ""
      })
    ).toBe(true);
    expect(
      await directory.exists({
        journeyId: "00000000-0000-4000-8000-000000000001",
        userId: "external_1",
        sourceType: "newcomer",
        sourceId: "newcomer_1",
        assigneeAdminUserId: null,
        assigneeName: ""
      })
    ).toBe(true);
    expect(
      await directory.exists({
        journeyId: "00000000-0000-4000-8000-000000000001",
        userId: "missing",
        sourceType: "member",
        sourceId: null,
        assigneeAdminUserId: null,
        assigneeName: ""
      })
    ).toBe(false);
  });
});

function record(ids: string[], id: string) {
  ids.push(id);
  return id.includes("known") ? {} : null;
}
