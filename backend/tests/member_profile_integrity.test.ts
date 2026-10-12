import { describe, expect, it } from "vitest";

import { InMemoryMemberRepository } from "../src/modules/members/in-memory-member.repository.js";
import { MemberService } from "../src/modules/members/member.service.js";
import { InMemoryMemberAuthRepository } from "../src/modules/members/auth/in-memory-member-auth.repository.js";
import { isPostgresMemberEmailConflict } from "../src/modules/members/postgres_member_errors.js";

describe("member profile integrity", () => {
  it("classifies only the member email uniqueness constraints as conflicts", () => {
    expect(
      isPostgresMemberEmailConflict({
        code: "23505",
        constraint: "users_email_key"
      })
    ).toBe(true);
    expect(
      isPostgresMemberEmailConflict({
        code: "23505",
        constraint: "users_email_unique"
      })
    ).toBe(true);
    expect(
      isPostgresMemberEmailConflict({
        code: "23505",
        constraint: "idx_member_profiles_user"
      })
    ).toBe(false);
    expect(isPostgresMemberEmailConflict({ code: "23505" })).toBe(false);
  });

  it("serializes verification attempts before accepting a valid code", async () => {
    const members = new InMemoryMemberRepository();
    const repository = new InMemoryMemberAuthRepository(members);
    const challengeId = "parallel-verification-challenge";
    const email = "parallel-verification@example.com";
    await repository.createLoginCode({
      id: challengeId,
      email,
      purpose: "registration_email_verification",
      passwordHash: "password-hash",
      codeHash: "correct-code-hash",
      expiresAt: new Date(Date.now() + 60_000)
    });
    const input = {
      challengeId,
      completedAt: new Date(),
      maxFailedAttempts: 5,
      member: memberInput(email, "Parallel Verification")
    };

    const results = await Promise.all([
      ...Array.from({ length: 5 }, () =>
        repository.completeRegistration({
          ...input,
          codeHash: "invalid-code-hash"
        })
      ),
      repository.completeRegistration({
        ...input,
        codeHash: "correct-code-hash"
      })
    ]);

    expect(results).toEqual(
      Array.from({ length: 6 }, () => ({ status: "challenge_invalid" }))
    );
    await expect(members.getByEmail(email)).resolves.toBeNull();
    await expect(
      repository.findLoginCodeById(challengeId)
    ).resolves.toMatchObject({ failedAttempts: 5, consumedAt: null });
  });

  it("maps concurrent admin member creation to one stable email conflict", async () => {
    const service = new MemberService(new InMemoryMemberRepository());
    const input = memberInput(
      "parallel-admin-create@example.com",
      "Parallel Admin Create"
    );

    const results = await Promise.allSettled([
      service.create(input),
      service.create(input)
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    const rejection = results.find((result) => result.status === "rejected");
    expect(rejection).toMatchObject({
      status: "rejected",
      reason: { code: "member_email_conflict", statusCode: 409 }
    });
  });

  it("maps concurrent admin email updates to one stable conflict", async () => {
    const service = new MemberService(new InMemoryMemberRepository());
    const first = await service.create(
      memberInput("update-first@example.com", "Update First")
    );
    const second = await service.create(
      memberInput("update-second@example.com", "Update Second")
    );

    const results = await Promise.allSettled([
      service.update(first.id, { email: "shared-update@example.com" }),
      service.update(second.id, { email: "shared-update@example.com" })
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    const rejection = results.find((result) => result.status === "rejected");
    expect(rejection).toMatchObject({
      status: "rejected",
      reason: { code: "member_email_conflict", statusCode: 409 }
    });
  });
});

function memberInput(email: string, displayName: string) {
  return {
    email,
    displayName,
    status: "active" as const,
    roles: ["member" as const],
    appLocale: "en" as const,
    notificationSettings: {
      weeklyBulletin: true,
      sermonPublished: true,
      lifePostPublished: true,
      prayerUpdates: false
    }
  };
}
