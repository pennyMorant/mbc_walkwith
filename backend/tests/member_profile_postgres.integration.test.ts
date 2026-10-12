import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostgresMemberAuthRepository } from "../src/modules/members/auth/postgres-member-auth.repository.js";
import { MemberEmailConflictRepositoryError } from "../src/modules/members/member.repository.js";
import { PostgresMemberRepository } from "../src/modules/members/postgres-member.repository.js";
import { createDbFromConnectionString } from "../src/shared/db/client.js";
import { memberLoginCodes, users } from "../src/shared/db/schema.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describeIfDatabase("member profile Postgres integrity", () => {
  beforeAll(async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });
  });

  it("normalizes a concurrent member email uniqueness conflict", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresMemberRepository(db);
    const email = `member-conflict-${randomUUID()}@example.com`;
    const input = memberInput(email, "Postgres Email Conflict");

    try {
      const results = await Promise.allSettled([
        repository.create(input),
        repository.create(input)
      ]);

      expect(
        results.filter((result) => result.status === "fulfilled")
      ).toHaveLength(1);
      const rejection = results.find((result) => result.status === "rejected");
      expect(rejection).toMatchObject({
        status: "rejected",
        reason: expect.any(MemberEmailConflictRepositoryError)
      });
    } finally {
      await db.delete(users).where(eq(users.email, email));
    }
  });

  it("serializes failed verification attempts in the challenge transaction", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const members = new PostgresMemberRepository(db);
    const repository = new PostgresMemberAuthRepository(db, members);
    const challengeId = randomUUID();
    const email = `verification-limit-${randomUUID()}@example.com`;
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
      member: memberInput(email, "Postgres Verification Limit")
    };

    try {
      const failures = await Promise.all(
        Array.from({ length: 5 }, () =>
          repository.completeRegistration({
            ...input,
            codeHash: "invalid-code-hash"
          })
        )
      );
      expect(failures).toEqual(
        Array.from({ length: 5 }, () => ({ status: "challenge_invalid" }))
      );
      await expect(
        repository.completeRegistration({
          ...input,
          codeHash: "correct-code-hash"
        })
      ).resolves.toEqual({ status: "challenge_invalid" });
      await expect(
        repository.findLoginCodeById(challengeId)
      ).resolves.toMatchObject({ failedAttempts: 5, consumedAt: null });
      await expect(members.getByEmail(email)).resolves.toBeNull();
    } finally {
      await db
        .delete(memberLoginCodes)
        .where(eq(memberLoginCodes.id, challengeId));
      await db.delete(users).where(eq(users.email, email));
    }
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
