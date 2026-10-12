import type {
  AdminUser,
  CareRequestUpdateRequest
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemoryCareRepository } from "../src/modules/care/in_memory_care.repository.js";
import type { CareRepository } from "../src/modules/care/care.repository.js";
import { CareService } from "../src/modules/care/care.service.js";

describe("care service concurrency", () => {
  it("rejects stale request and follow-up writes by version", async () => {
    const repository = new InMemoryCareRepository();
    const created = await createCareRequest(repository);

    expect(
      await repository.update(created.id, { status: "assigned" }, 0)
    ).toBeNull();
    expect((await repository.getById(created.id))?.status).toBe("submitted");

    expect(
      await repository.createFollowUp(
        {
          careRequestId: created.id,
          authorAdminUserId: ownerActor.id,
          authorName: ownerActor.name,
          note: "This stale follow-up must not be written.",
          status: "completed"
        },
        0,
        { expectedStatus: "submitted", nextStatus: "in_progress" }
      )
    ).toBeNull();
    expect(await repository.listFollowUps(created.id)).toEqual([]);
  });

  it("returns canonical conflict evidence after a concurrent update", async () => {
    const base = new InMemoryCareRepository();
    const created = await createCareRequest(base);
    const repository = repositoryWithConcurrentUpdate(base, {
      status: "assigned"
    });
    const service = new CareService(repository, adminDirectory);

    await expect(
      service.updateForAdmin(created.id, { status: "resolved" }, ownerActor)
    ).rejects.toMatchObject({
      code: "care_request_state_conflict",
      statusCode: 409,
      evidence: {
        careRequestId: created.id,
        status: "assigned",
        privacyLevel: "pastoral_only",
        version: 2
      }
    });
  });

  it("rechecks privacy before exposing conflict evidence", async () => {
    const base = new InMemoryCareRepository();
    const created = await createCareRequest(base);
    const repository = repositoryWithConcurrentUpdate(base, {
      privacyLevel: "admin_restricted"
    });
    const service = new CareService(repository, adminDirectory);

    await expect(
      service.updateForAdmin(created.id, { status: "resolved" }, pastorActor)
    ).rejects.toMatchObject({
      code: "care_privacy_denied",
      statusCode: 403,
      evidence: { careRequestId: created.id }
    });
  });
});

async function createCareRequest(repository: InMemoryCareRepository) {
  return repository.create({
    userId: "member-care",
    memberDisplayName: "Care Member",
    memberEmail: "care-member@example.com",
    title: "Care request",
    body: "Please ask a pastor to follow up.",
    privacyLevel: "pastoral_only"
  });
}

function repositoryWithConcurrentUpdate(
  base: InMemoryCareRepository,
  concurrentUpdate: CareRequestUpdateRequest
): CareRepository {
  return {
    list: base.list.bind(base),
    listForUser: base.listForUser.bind(base),
    getById: base.getById.bind(base),
    create: base.create.bind(base),
    listFollowUps: base.listFollowUps.bind(base),
    createFollowUp: base.createFollowUp.bind(base),
    update: async (id, _input, expectedVersion) => {
      await base.update(id, concurrentUpdate, expectedVersion);
      return null;
    }
  };
}

const ownerActor = {
  id: "owner-admin",
  name: "Owner Admin",
  role: "owner"
} as const;

const pastorActor = {
  id: "pastor-admin",
  name: "Pastor Admin",
  role: "pastor"
} as const;

const adminDirectory = {
  async listActiveUsersWithPermission(): Promise<AdminUser[]> {
    return [];
  },
  async findActiveUserWithPermission(): Promise<AdminUser | null> {
    return null;
  }
};
