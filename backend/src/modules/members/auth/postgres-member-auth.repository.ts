import type { MemberCreateRequest, MemberProfile } from "@mbc/api-contracts";
import { and, eq, gt, isNull, sql } from "drizzle-orm";

import type { AppDb } from "../../../shared/db/client.js";
import {
  memberExternalIdentities,
  memberLoginCodes,
  memberProfiles,
  memberSessions,
  users
} from "../../../shared/db/schema.js";
import type { MemberRepository } from "../member.repository.js";
import { isPostgresMemberEmailConflict } from "../postgres_member_errors.js";
import type {
  CreateMemberLoginCodeInput,
  CreateMemberSessionInput,
  CreateMemberWithPasswordInput,
  CompleteMemberPasswordResetInput,
  CompleteMemberRegistrationInput,
  MemberAuthRepository,
  MemberCredentialCreationResult,
  MemberLoginCodeRecord,
  MemberPasswordCredential,
  PasswordResetChallengeResult,
  MemberPasswordResetCompletionResult,
  MemberRegistrationCompletionResult,
  ResolveExternalIdentityInput,
  ResolveExternalIdentityResult
} from "./member-auth.repository.js";
import { memberAuthCodeMatches } from "./member_auth_code.js";

export class PostgresMemberAuthRepository implements MemberAuthRepository {
  constructor(
    private readonly db: AppDb,
    private readonly memberRepository: MemberRepository
  ) {}

  findMemberByEmail(email: string): Promise<MemberProfile | null> {
    return this.memberRepository.getByEmail(email);
  }

  findMemberById(id: string): Promise<MemberProfile | null> {
    return this.memberRepository.getById(id);
  }

  async findPasswordCredentialByEmail(
    email: string
  ): Promise<MemberPasswordCredential | null> {
    const [row] = await this.db
      .select({
        userId: users.id,
        email: users.email,
        status: users.status,
        passwordHash: users.passwordHash
      })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return row ?? null;
  }

  createMember(input: MemberCreateRequest): Promise<MemberProfile> {
    return this.memberRepository.create(input);
  }

  async resolveExternalIdentity(
    input: ResolveExternalIdentityInput
  ): Promise<ResolveExternalIdentityResult> {
    const result = await this.db.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${input.provider}:${input.providerSubject}`}))`
      );
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.email}))`
      );

      const [linked] = await transaction
        .select({ userId: memberExternalIdentities.userId })
        .from(memberExternalIdentities)
        .where(
          and(
            eq(memberExternalIdentities.provider, input.provider),
            eq(memberExternalIdentities.providerSubject, input.providerSubject)
          )
        )
        .limit(1);
      if (linked) {
        return {
          status: "resolved" as const,
          userId: linked.userId,
          memberCreated: false,
          identityCreated: false
        };
      }

      const [existingUser] = await transaction
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      let userId = existingUser?.id;
      let created = false;
      if (userId) {
        const [providerIdentity] = await transaction
          .select({ id: memberExternalIdentities.id })
          .from(memberExternalIdentities)
          .where(
            and(
              eq(memberExternalIdentities.userId, userId),
              eq(memberExternalIdentities.provider, input.provider)
            )
          )
          .limit(1);
        if (providerIdentity) {
          return { status: "identity_conflict" as const };
        }
      } else {
        if (!input.newMember) {
          return { status: "registration_closed" as const };
        }
        userId = await insertMember(transaction, input.newMember);
        created = true;
      }

      await transaction.insert(memberExternalIdentities).values({
        userId,
        provider: input.provider,
        providerSubject: input.providerSubject,
        email: input.email,
        updatedAt: new Date()
      });
      return {
        status: "resolved" as const,
        userId,
        memberCreated: created,
        identityCreated: true
      };
    });
    if (result.status !== "resolved") {
      return result;
    }
    const member = await this.memberRepository.getById(result.userId);
    if (!member) {
      throw new Error("Resolved external member profile could not be loaded.");
    }
    return {
      status: "resolved",
      member,
      memberCreated: result.memberCreated,
      identityCreated: result.identityCreated
    };
  }

  async createMemberWithPassword(
    input: CreateMemberWithPasswordInput
  ): Promise<MemberCredentialCreationResult> {
    let memberId: string;
    try {
      memberId = await this.db.transaction((transaction) =>
        insertMemberWithPassword(
          transaction,
          input.member,
          input.passwordHash,
          input.passwordUpdatedAt
        )
      );
    } catch (error) {
      if (
        isPostgresMemberEmailConflict(error) &&
        (await this.memberRepository.getByEmail(input.member.email))
      ) {
        return { status: "email_conflict" };
      }
      throw error;
    }
    const member = await this.memberRepository.getById(memberId);
    if (!member) {
      throw new Error("Created member profile could not be loaded.");
    }
    return { status: "created", member };
  }

  async completeRegistration(
    input: CompleteMemberRegistrationInput
  ): Promise<MemberRegistrationCompletionResult> {
    let result:
      | { status: "challenge_invalid" | "email_conflict" }
      | { status: "created"; memberId: string };
    try {
      result = await this.db.transaction(async (transaction) => {
        const [code] = await transaction
          .select()
          .from(memberLoginCodes)
          .where(eq(memberLoginCodes.id, input.challengeId))
          .for("update");
        if (
          !code ||
          code.consumedAt !== null ||
          code.expiresAt <= input.completedAt ||
          code.failedAttempts >= input.maxFailedAttempts ||
          code.purpose !== "registration_email_verification" ||
          !code.passwordHash
        ) {
          return { status: "challenge_invalid" as const };
        }
        if (!memberAuthCodeMatches(code.codeHash, input.codeHash)) {
          await transaction
            .update(memberLoginCodes)
            .set({
              failedAttempts: sql`${memberLoginCodes.failedAttempts} + 1`
            })
            .where(eq(memberLoginCodes.id, input.challengeId));
          return { status: "challenge_invalid" as const };
        }
        const [existing] = await transaction
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, code.email))
          .limit(1);
        if (existing) {
          return { status: "email_conflict" as const };
        }
        const memberId = await insertMemberWithPassword(
          transaction,
          { ...input.member, email: code.email },
          code.passwordHash,
          input.completedAt
        );
        await transaction
          .update(memberLoginCodes)
          .set({ consumedAt: input.completedAt })
          .where(eq(memberLoginCodes.id, input.challengeId));
        return { status: "created" as const, memberId };
      });
    } catch (error) {
      if (isPostgresMemberEmailConflict(error)) {
        return { status: "email_conflict" };
      }
      throw error;
    }
    if (result.status !== "created") {
      return result;
    }
    const member = await this.memberRepository.getById(result.memberId);
    if (!member) {
      throw new Error("Completed member profile could not be loaded.");
    }
    return { status: "created", member };
  }

  async completePasswordReset(
    input: CompleteMemberPasswordResetInput
  ): Promise<MemberPasswordResetCompletionResult> {
    return this.db.transaction(async (transaction) => {
      const [code] = await transaction
        .select()
        .from(memberLoginCodes)
        .where(eq(memberLoginCodes.id, input.challengeId))
        .for("update");
      if (
        !code ||
        code.consumedAt !== null ||
        code.expiresAt <= input.completedAt ||
        code.failedAttempts >= input.maxFailedAttempts ||
        code.purpose !== "password_reset"
      ) {
        return { status: "challenge_invalid" };
      }
      if (!memberAuthCodeMatches(code.codeHash, input.codeHash)) {
        await transaction
          .update(memberLoginCodes)
          .set({
            failedAttempts: sql`${memberLoginCodes.failedAttempts} + 1`
          })
          .where(eq(memberLoginCodes.id, input.challengeId));
        return { status: "challenge_invalid" };
      }
      const [user] = await transaction
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, code.email))
        .limit(1);
      if (!user) {
        return { status: "challenge_invalid" };
      }
      await transaction
        .update(users)
        .set({ passwordHash: input.passwordHash, passwordUpdatedAt: input.completedAt, updatedAt: input.completedAt })
        .where(eq(users.id, user.id));
      await transaction
        .update(memberSessions)
        .set({ revokedAt: input.completedAt })
        .where(eq(memberSessions.userId, user.id));
      await transaction
        .update(memberLoginCodes)
        .set({ consumedAt: input.completedAt })
        .where(eq(memberLoginCodes.id, input.challengeId));
      return { status: "completed" };
    });
  }

  async createLoginCode(
    input: CreateMemberLoginCodeInput
  ): Promise<MemberLoginCodeRecord> {
    const [row] = await this.db
      .insert(memberLoginCodes)
      .values(input)
      .returning();
    if (!row) {
      throw new Error("Failed to create member login code.");
    }
    return loginCodeFromRow(row);
  }

  async findLoginCodeById(id: string): Promise<MemberLoginCodeRecord | null> {
    const [row] = await this.db
      .select()
      .from(memberLoginCodes)
      .where(eq(memberLoginCodes.id, id))
      .limit(1);
    return row ? loginCodeFromRow(row) : null;
  }

  async findActiveLoginCode(
    email: string,
    purpose: string,
    now: Date
  ): Promise<MemberLoginCodeRecord | null> {
    const [row] = await this.db
      .select()
      .from(memberLoginCodes)
      .where(
        and(
          eq(memberLoginCodes.email, email),
          eq(memberLoginCodes.purpose, purpose),
          isNull(memberLoginCodes.consumedAt),
          gt(memberLoginCodes.expiresAt, now)
        )
      )
      .orderBy(memberLoginCodes.createdAt)
      .limit(1);
    return row ? loginCodeFromRow(row) : null;
  }

  async createOrGetActivePasswordResetCode(
    input: CreateMemberLoginCodeInput,
    now: Date
  ): Promise<PasswordResetChallengeResult> {
    return this.db.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.email}))`
      );
      const [existing] = await transaction
        .select()
        .from(memberLoginCodes)
        .where(
          and(
            eq(memberLoginCodes.email, input.email),
            eq(memberLoginCodes.purpose, "password_reset"),
            isNull(memberLoginCodes.consumedAt),
            gt(memberLoginCodes.expiresAt, now)
          )
        )
        .orderBy(memberLoginCodes.createdAt)
        .limit(1);
      if (existing) {
        return { status: "existing", code: loginCodeFromRow(existing) };
      }
      const [created] = await transaction
        .insert(memberLoginCodes)
        .values(input)
        .returning();
      if (!created) {
        throw new Error("Failed to create member password reset code.");
      }
      return { status: "created", code: loginCodeFromRow(created) };
    });
  }

  async consumeLoginCode(id: string, consumedAt: Date): Promise<void> {
    await this.db
      .update(memberLoginCodes)
      .set({ consumedAt })
      .where(eq(memberLoginCodes.id, id));
  }

  async createSession(input: CreateMemberSessionInput): Promise<void> {
    const now = new Date();
    await this.db.transaction(async (transaction) => {
      const clientKey = [
        "member_session",
        input.userId,
        input.ipAddress ?? "unknown_ip",
        input.userAgent ?? "unknown_agent"
      ].join(":");
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${clientKey}))`
      );
      await transaction
        .update(memberSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(memberSessions.userId, input.userId),
            input.ipAddress === null
              ? isNull(memberSessions.ipAddress)
              : eq(memberSessions.ipAddress, input.ipAddress),
            input.userAgent === null
              ? isNull(memberSessions.userAgent)
              : eq(memberSessions.userAgent, input.userAgent),
            isNull(memberSessions.revokedAt),
            gt(memberSessions.expiresAt, now)
          )
        );
      await transaction.insert(memberSessions).values(input);
    });
  }

  async isSessionActive(tokenId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(memberSessions)
      .where(eq(memberSessions.tokenId, tokenId))
      .limit(1);
    return Boolean(
      row && row.revokedAt === null && row.expiresAt.getTime() > Date.now()
    );
  }

  async revokeSession(tokenId: string, revokedAt: Date): Promise<void> {
    await this.db
      .update(memberSessions)
      .set({ revokedAt })
      .where(eq(memberSessions.tokenId, tokenId));
  }
}

type LoginCodeRow = typeof memberLoginCodes.$inferSelect;
type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

async function insertMemberWithPassword(
  transaction: AppTransaction,
  input: MemberCreateRequest,
  passwordHash: string,
  updatedAt: Date
): Promise<string> {
  return insertMember(transaction, input, {
    passwordHash,
    passwordUpdatedAt: updatedAt
  });
}

async function insertMember(
  transaction: AppTransaction,
  input: MemberCreateRequest,
  credential?: { passwordHash: string; passwordUpdatedAt: Date }
): Promise<string> {
  const [user] = await transaction
    .insert(users)
    .values({
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName,
      phone: input.phone ?? null,
      passwordHash: credential?.passwordHash ?? null,
      passwordUpdatedAt: credential?.passwordUpdatedAt ?? null,
      role: (input.roles ?? ["member"]).join(","),
      status: input.status ?? "active",
      updatedAt: credential?.passwordUpdatedAt ?? new Date()
    })
    .returning({ id: users.id });
  if (!user) {
    throw new Error("Failed to create member credential.");
  }
  const [profile] = await transaction
    .insert(memberProfiles)
    .values({
      userId: user.id,
      address: input.address ?? null,
      faithStartYear: input.faithStartYear ?? null,
      baptizedYear: input.baptizedYear ?? null,
      joinedChurchAt: input.joinedChurchAt
        ? new Date(`${input.joinedChurchAt}T00:00:00.000Z`)
        : null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      appLocale: input.appLocale ?? "en",
      fellowshipGroupId: input.fellowshipGroupId ?? null,
      notificationSettings: input.notificationSettings ?? {}
    })
    .returning({ id: memberProfiles.id });
  if (!profile) {
    throw new Error("Failed to create member profile.");
  }
  return user.id;
}

function loginCodeFromRow(row: LoginCodeRow): MemberLoginCodeRecord {
  return {
    id: row.id,
    email: row.email,
    purpose: row.purpose,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    codeHash: row.codeHash,
    failedAttempts: row.failedAttempts,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
    createdAt: row.createdAt
  };
}
