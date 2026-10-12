import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostgresMemberAuthRepository } from "../src/modules/members/auth/postgres-member-auth.repository.js";
import { PostgresMemberRepository } from "../src/modules/members/postgres-member.repository.js";
import { createDbFromConnectionString } from "../src/shared/db/client.js";
import { memberExternalIdentities, users } from "../src/shared/db/schema.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describeIfDatabase("member Firebase identity Postgres integrity", () => {
  beforeAll(async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });
  });

  it("serializes concurrent first sign-in for the same external identity", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresMemberAuthRepository(
      db,
      new PostgresMemberRepository(db)
    );
    const email = `firebase-concurrent-${randomUUID()}@example.com`;
    const input = {
      provider: "google" as const,
      providerSubject: `google-${randomUUID()}`,
      email,
      newMember: memberInput(email)
    };

    try {
      const results = await Promise.all([
        repository.resolveExternalIdentity(input),
        repository.resolveExternalIdentity(input)
      ]);
      expect(results).toEqual([
        expect.objectContaining({ status: "resolved" }),
        expect.objectContaining({ status: "resolved" })
      ]);
      const resolved = results.filter((result) => result.status === "resolved");
      expect(new Set(resolved.map((result) => result.member.id)).size).toBe(1);
      expect(resolved.filter((result) => result.identityCreated)).toHaveLength(1);
      expect(resolved.filter((result) => result.memberCreated)).toHaveLength(1);
    } finally {
      await db.delete(users).where(eq(users.email, email));
    }
  });

  it("rejects a second subject for the same member and provider", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresMemberAuthRepository(
      db,
      new PostgresMemberRepository(db)
    );
    const email = `firebase-conflict-${randomUUID()}@example.com`;
    const firstSubject = `google-${randomUUID()}`;

    try {
      await repository.resolveExternalIdentity({
        provider: "google",
        providerSubject: firstSubject,
        email,
        newMember: memberInput(email)
      });
      await expect(
        repository.resolveExternalIdentity({
          provider: "google",
          providerSubject: `google-${randomUUID()}`,
          email,
          newMember: null
        })
      ).resolves.toEqual({ status: "identity_conflict" });
      await expect(
        repository.resolveExternalIdentity({
          provider: "google",
          providerSubject: firstSubject,
          email,
          newMember: null
        })
      ).resolves.toMatchObject({
        status: "resolved",
        memberCreated: false,
        identityCreated: false
      });
    } finally {
      await db
        .delete(memberExternalIdentities)
        .where(eq(memberExternalIdentities.email, email));
      await db.delete(users).where(eq(users.email, email));
    }
  });

  it("keeps only the newest session active for the same member client", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresMemberAuthRepository(
      db,
      new PostgresMemberRepository(db)
    );
    const email = `firebase-session-${randomUUID()}@example.com`;
    const identity = await repository.resolveExternalIdentity({
      provider: "apple",
      providerSubject: `apple-${randomUUID()}`,
      email,
      newMember: memberInput(email)
    });
    if (identity.status !== "resolved") {
      throw new Error("expected resolved identity");
    }
    const firstTokenId = randomUUID();
    const secondTokenId = randomUUID();
    const session = {
      userId: identity.member.id,
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: "127.0.0.1",
      userAgent: "postgres-integration"
    };

    try {
      await Promise.all([
        repository.createSession({ ...session, tokenId: firstTokenId }),
        repository.createSession({ ...session, tokenId: secondTokenId })
      ]);
      const active = await Promise.all([
        repository.isSessionActive(firstTokenId),
        repository.isSessionActive(secondTokenId)
      ]);
      expect(active.filter(Boolean)).toHaveLength(1);
    } finally {
      await db.delete(users).where(eq(users.email, email));
    }
  });
});

function memberInput(email: string) {
  return {
    email,
    displayName: "Firebase Integration Member",
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
