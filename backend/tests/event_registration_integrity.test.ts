import { describe, expect, it } from "vitest";

import { InMemoryLifePostRepository } from "../src/modules/life/in-memory-life-post.repository.js";
import { LifeEventAttendanceService } from "../src/modules/life/life_event_attendance.service.js";
import { LifeEventRegistrationService } from "../src/modules/life/life_event_registration.service.js";

describe("event registration integrity", () => {
  it("excludes absent and cancelled registrations from active participation", async () => {
    const { repository, registrationService, postId } = await buildFixture();
    const confirmed = await createAdminRegistration(
      registrationService,
      postId,
      "Confirmed",
      2
    );
    const checkedIn = await createAdminRegistration(
      registrationService,
      postId,
      "Checked in",
      3
    );
    const absent = await createAdminRegistration(
      registrationService,
      postId,
      "Absent",
      4
    );
    const cancelled = await createAdminRegistration(
      registrationService,
      postId,
      "Cancelled",
      5
    );

    await registrationService.updateRegistration(postId, checkedIn.id, {
      status: "checked_in"
    });
    await registrationService.updateRegistration(postId, absent.id, {
      status: "absent"
    });
    await registrationService.updateRegistration(postId, cancelled.id, {
      status: "cancelled"
    });

    expect(confirmed.status).toBe("confirmed");
    await expect(repository.summarizeEventParticipation()).resolves.toEqual({
      registrationCount: 2,
      attendeeCount: 5,
      checkedInCount: 3
    });
  });

  it("serializes cancellation against member check-in", async () => {
    const { repository, registrationService, attendanceService, postId } =
      await buildFixture();
    const userId = "member-race";
    await registrationService.registerForEvent(
      postId,
      {
        id: userId,
        displayName: "Race Member",
        email: "race@example.com"
      },
      { partySize: 1 }
    );

    const [cancelResult, checkInResult] = await Promise.allSettled([
      registrationService.cancelEventRegistration(postId, userId),
      attendanceService.checkInForMember(postId, userId)
    ]);

    expect(cancelResult.status).toBe("fulfilled");
    expect(checkInResult.status).toBe("rejected");
    if (checkInResult.status === "rejected") {
      expect(checkInResult.reason).toMatchObject({
        code: "registration_not_found"
      });
    }
    const registrations = await repository.listAllRegistrations(postId);
    expect(registrations).toHaveLength(1);
    expect(registrations[0]?.status).toBe("cancelled");
  });

  it("returns one active code for concurrent non-rotating requests", async () => {
    const { attendanceService, postId } = await buildFixture();

    const codes = await Promise.all([
      attendanceService.createOrRotateCheckInCode(postId, { rotate: false }),
      attendanceService.createOrRotateCheckInCode(postId, { rotate: false })
    ]);

    expect(codes[0]?.id).toBe(codes[1]?.id);
    expect(codes[0]?.qrPayload).toBe(codes[1]?.qrPayload);
  });

  it("rolls back registration and code mutations when a lock operation fails", async () => {
    const { repository, postId } = await buildFixture();
    const originalCode = await repository.createCheckInCode({
      lifePostId: postId,
      qrPayload: "mbcg:event-check-in:original",
      shortCode: "ORIGINAL",
      expiresAt: null,
      createdByAdminUserId: null
    });

    await expect(
      repository.withEventRegistrationLock(postId, async (store) => {
        await store.createRegistration({
          lifePostId: postId,
          userId: "rollback-member",
          attendeeName: "Rollback Member",
          attendeeEmail: null,
          partySize: 2,
          note: ""
        });
        await store.disableActiveCheckInCodes(postId);
        await store.createCheckInCode({
          lifePostId: postId,
          qrPayload: "mbcg:event-check-in:rollback",
          shortCode: "ROLLBACK",
          expiresAt: null,
          createdByAdminUserId: null
        });
        throw new Error("force rollback");
      })
    ).rejects.toThrow("force rollback");

    await expect(repository.listAllRegistrations(postId)).resolves.toEqual([]);
    await expect(
      repository.getActiveCheckInCode(postId)
    ).resolves.toMatchObject({ id: originalCode.id, disabledAt: null });
    await expect(
      repository.getCheckInCodeByValue("mbcg:event-check-in:rollback")
    ).resolves.toBeNull();
  });

  it("updates registrations by identity and exports beyond the list limit", async () => {
    const { repository, registrationService, postId } = await buildFixture();
    const registrations = [];
    for (let index = 0; index < 501; index += 1) {
      registrations.push(
        await repository.createRegistration({
          lifePostId: postId,
          userId: null,
          attendeeName: `Attendee ${index}`,
          attendeeEmail: null,
          partySize: 1,
          note: ""
        })
      );
    }
    const firstPage = await repository.listRegistrations(postId, {
      limit: 500,
      offset: 0
    });
    expect(firstPage.total).toBe(501);
    expect(firstPage.items).toHaveLength(500);
    const secondPage = await repository.listRegistrations(postId, {
      limit: 500,
      offset: 500
    });
    expect(secondPage.total).toBe(501);
    expect(secondPage.items).toHaveLength(1);
    const listedIds = new Set(
      firstPage.items.map((registration) => registration.id)
    );
    const outsideList = registrations.find(
      (registration) => !listedIds.has(registration.id)
    );
    expect(outsideList).toBeDefined();

    const updated = await registrationService.updateRegistration(
      postId,
      outsideList!.id,
      { partySize: 2 }
    );
    expect(updated.partySize).toBe(2);

    const exported = await registrationService.exportRegistrationsCsv(postId);
    expect(exported).not.toBeNull();
    expect(exported!.csv.split("\n")).toHaveLength(502);
    expect(exported!.csv).toContain(outsideList!.id);
  });
});

async function buildFixture() {
  const repository = new InMemoryLifePostRepository();
  const post = await repository.create({
    type: "fellowship",
    title: "Registration Integrity Event",
    body: "Event used to verify canonical registration behavior.",
    meta: "",
    iconName: "event",
    startsAt: null,
    endsAt: null,
    visibility: "members",
    imageUrl: null,
    displayWeight: 0,
    ctaLabel: null,
    ctaUrl: null,
    registrationEnabled: true,
    registrationCapacity: null,
    registrationDeadline: null,
    registrationAllowCancellation: true,
    registrationMaxPartySize: 20,
    status: "published"
  });
  const registrationService = new LifeEventRegistrationService(repository);
  const attendanceService = new LifeEventAttendanceService(
    repository,
    async (id) => repository.getById(id)
  );
  return {
    repository,
    registrationService,
    attendanceService,
    postId: post.id
  };
}

function createAdminRegistration(
  service: LifeEventRegistrationService,
  postId: string,
  attendeeName: string,
  partySize: number
) {
  return service.createRegistrationForAdmin(postId, {
    attendeeName,
    partySize
  });
}
