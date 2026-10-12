import type { ServingAssignment } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import {
  assignmentConflictIds,
  assignmentScheduleState,
  availabilityConflictIds
} from "../src/modules/serving/serving_schedule_rules.js";

describe("serving schedule rules", () => {
  it("only reports overlapping schedule-occupying assignments for one user", () => {
    const next = assignmentScheduleState(
      assignment(
        "next",
        "member-a",
        "2026-07-12T16:00:00.000Z",
        "2026-07-12T18:00:00.000Z"
      )
    );
    const assignments = [
      assignment(
        "overlap",
        "member-a",
        "2026-07-12T17:00:00.000Z",
        "2026-07-12T19:00:00.000Z"
      ),
      assignment(
        "adjacent",
        "member-a",
        "2026-07-12T18:00:00.000Z",
        "2026-07-12T19:00:00.000Z"
      ),
      assignment(
        "different-member",
        "member-b",
        "2026-07-12T17:00:00.000Z",
        "2026-07-12T19:00:00.000Z"
      ),
      assignment(
        "declined",
        "member-a",
        "2026-07-12T17:00:00.000Z",
        "2026-07-12T19:00:00.000Z",
        "declined"
      )
    ];

    expect(assignmentConflictIds(assignments, next)).toEqual(["overlap"]);
  });

  it("treats an assignment without an end as a point in the schedule", () => {
    const existing = assignment(
      "existing",
      "member-a",
      "2026-07-12T16:00:00.000Z",
      null
    );
    const sameStart = assignmentScheduleState(
      assignment(
        "same-start",
        "member-a",
        "2026-07-12T16:00:00.000Z",
        null
      )
    );
    const later = assignmentScheduleState(
      assignment(
        "later",
        "member-a",
        "2026-07-12T16:00:00.001Z",
        null
      )
    );

    expect(assignmentConflictIds([existing], sameStart)).toEqual(["existing"]);
    expect(assignmentConflictIds([existing], later)).toEqual([]);
  });

  it("allows adjacent availability but rejects overlap for the same user", () => {
    const records = [
      {
        id: "existing",
        userId: "member-a",
        startsAt: "2026-07-12T16:00:00.000Z",
        endsAt: "2026-07-12T18:00:00.000Z"
      }
    ];

    expect(
      availabilityConflictIds(records, {
        userId: "member-a",
        startsAt: "2026-07-12T17:00:00.000Z",
        endsAt: "2026-07-12T19:00:00.000Z"
      })
    ).toEqual(["existing"]);
    expect(
      availabilityConflictIds(records, {
        userId: "member-a",
        startsAt: "2026-07-12T18:00:00.000Z",
        endsAt: "2026-07-12T19:00:00.000Z"
      })
    ).toEqual([]);
  });
});

function assignment(
  id: string,
  userId: string,
  startsAt: string,
  endsAt: string | null,
  status: ServingAssignment["status"] = "scheduled"
) {
  return { id, userId, startsAt, endsAt, status };
}
