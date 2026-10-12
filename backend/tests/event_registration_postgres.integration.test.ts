import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostgresLifePostRepository } from "../src/modules/life/postgres-life-post.repository.js";
import { createDbFromConnectionString } from "../src/shared/db/client.js";
import { publicPosts } from "../src/shared/db/schema.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describeIfDatabase("event registration Postgres transactions", () => {
  beforeAll(async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });
  });

  it("rolls back every registration and code mutation in a failed lock", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresLifePostRepository(db);
    const suffix = randomUUID();
    const post = await repository.create({
      type: "fellowship",
      title: `Registration transaction ${suffix}`,
      body: "Verifies atomic registration and attendance persistence.",
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
      registrationCapacity: 10,
      registrationDeadline: null,
      registrationAllowCancellation: true,
      registrationMaxPartySize: 5,
      status: "published"
    });
    const originalCode = await repository.createCheckInCode({
      lifePostId: post.id,
      qrPayload: `mbcg:event-check-in:original-${suffix}`,
      shortCode: `ORIGINAL-${suffix}`,
      expiresAt: null,
      createdByAdminUserId: null
    });
    const rolledBackCode = `mbcg:event-check-in:rollback-${suffix}`;

    try {
      await expect(
        repository.withEventRegistrationLock(post.id, async (store) => {
          await store.createRegistration({
            lifePostId: post.id,
            userId: `member-${suffix}`,
            attendeeName: "Rollback Member",
            attendeeEmail: null,
            partySize: 2,
            note: ""
          });
          expect(await store.countActiveRegistrationPartySize(post.id)).toBe(2);
          await store.disableActiveCheckInCodes(post.id);
          await store.createCheckInCode({
            lifePostId: post.id,
            qrPayload: rolledBackCode,
            shortCode: `ROLLBACK-${suffix}`,
            expiresAt: null,
            createdByAdminUserId: null
          });
          throw new Error("force transaction rollback");
        })
      ).rejects.toThrow("force transaction rollback");

      await expect(repository.listAllRegistrations(post.id)).resolves.toEqual(
        []
      );
      await expect(
        repository.getActiveCheckInCode(post.id)
      ).resolves.toMatchObject({ id: originalCode.id, disabledAt: null });
      await expect(
        repository.getCheckInCodeByValue(rolledBackCode)
      ).resolves.toBeNull();
    } finally {
      await db.delete(publicPosts).where(eq(publicPosts.id, post.id));
    }
  });
});
