import type { MemberCreateRequest, MemberProfile } from "@mbc/api-contracts";

import type { MemberRepository } from "../member.repository.js";
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

type MemberSessionRecord = CreateMemberSessionInput & {
  revokedAt: Date | null;
};

export class InMemoryMemberAuthRepository implements MemberAuthRepository {
  private loginCodes: MemberLoginCodeRecord[] = [];
  private sessions = new Map<string, MemberSessionRecord>();
  private credentials = new Map<string, string>();
  private externalIdentities = new Map<
    string,
    { userId: string; provider: string; providerSubject: string }
  >();
  private registrationLock = Promise.resolve();

  constructor(private readonly memberRepository: MemberRepository) {}

  findMemberByEmail(email: string): Promise<MemberProfile | null> {
    return this.memberRepository.getByEmail(email);
  }

  findMemberById(id: string): Promise<MemberProfile | null> {
    return this.memberRepository.getById(id);
  }

  async findPasswordCredentialByEmail(
    email: string
  ): Promise<MemberPasswordCredential | null> {
    const member = await this.memberRepository.getByEmail(email);
    if (!member) {
      return null;
    }
    return {
      userId: member.id,
      email: member.email,
      status: member.status,
      passwordHash: this.credentials.get(member.id) ?? null
    };
  }

  createMember(input: MemberCreateRequest): Promise<MemberProfile> {
    return this.memberRepository.create(input);
  }

  resolveExternalIdentity(
    input: ResolveExternalIdentityInput
  ): Promise<ResolveExternalIdentityResult> {
    return this.withRegistrationLock(async () => {
      const identityKey = `${input.provider}:${input.providerSubject}`;
      const linked = this.externalIdentities.get(identityKey);
      if (linked) {
        const member = await this.memberRepository.getById(linked.userId);
        return member
          ? {
              status: "resolved",
              member,
              memberCreated: false,
              identityCreated: false
            }
          : { status: "identity_conflict" };
      }

      let member = await this.memberRepository.getByEmail(input.email);
      let created = false;
      if (member) {
        const providerAlreadyLinked = [...this.externalIdentities.values()].some(
          (identity) =>
            identity.userId === member!.id &&
            identity.provider === input.provider
        );
        if (providerAlreadyLinked) {
          return { status: "identity_conflict" };
        }
      } else {
        if (!input.newMember) {
          return { status: "registration_closed" };
        }
        member = await this.memberRepository.create(input.newMember);
        created = true;
      }
      this.externalIdentities.set(identityKey, {
        userId: member.id,
        provider: input.provider,
        providerSubject: input.providerSubject
      });
      return {
        status: "resolved",
        member,
        memberCreated: created,
        identityCreated: true
      };
    });
  }

  createMemberWithPassword(
    input: CreateMemberWithPasswordInput
  ): Promise<MemberCredentialCreationResult> {
    return this.withRegistrationLock(async () => {
      const existing = await this.memberRepository.getByEmail(input.member.email);
      if (existing) {
        return { status: "email_conflict" };
      }
      const member = await this.memberRepository.create(input.member);
      this.credentials.set(member.id, input.passwordHash);
      return { status: "created", member };
    });
  }

  completeRegistration(
    input: CompleteMemberRegistrationInput
  ): Promise<MemberRegistrationCompletionResult> {
    return this.withRegistrationLock(async () => {
      const code = this.loginCodes.find(
        (record) => record.id === input.challengeId
      );
      if (
        !code ||
        code.consumedAt !== null ||
        code.expiresAt <= input.completedAt ||
        code.failedAttempts >= input.maxFailedAttempts ||
        code.purpose !== "registration_email_verification" ||
        !code.passwordHash
      ) {
        return { status: "challenge_invalid" };
      }
      if (!memberAuthCodeMatches(code.codeHash, input.codeHash)) {
        code.failedAttempts += 1;
        return { status: "challenge_invalid" };
      }
      const existing = await this.memberRepository.getByEmail(code.email);
      if (existing) {
        return { status: "email_conflict" };
      }
      const member = await this.memberRepository.create({
        ...input.member,
        email: code.email
      });
      this.credentials.set(member.id, code.passwordHash);
      code.consumedAt = input.completedAt;
      return { status: "created", member };
    });
  }

  completePasswordReset(
    input: CompleteMemberPasswordResetInput
  ): Promise<MemberPasswordResetCompletionResult> {
    return this.withRegistrationLock(async () => {
      const code = this.loginCodes.find((record) => record.id === input.challengeId);
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
        code.failedAttempts += 1;
        return { status: "challenge_invalid" };
      }
      const member = await this.memberRepository.getByEmail(code.email);
      if (!member) {
        return { status: "challenge_invalid" };
      }
      this.credentials.set(member.id, input.passwordHash);
      for (const session of this.sessions.values()) {
        if (session.userId === member.id) {
          session.revokedAt = input.completedAt;
        }
      }
      code.consumedAt = input.completedAt;
      return { status: "completed" };
    });
  }

  async createLoginCode(
    input: CreateMemberLoginCodeInput
  ): Promise<MemberLoginCodeRecord> {
    const record = {
      id: input.id,
      email: input.email,
      purpose: input.purpose,
      displayName: input.displayName ?? null,
      passwordHash: input.passwordHash ?? null,
      codeHash: input.codeHash,
      failedAttempts: 0,
      expiresAt: input.expiresAt,
      consumedAt: null,
      createdAt: new Date()
    };
    this.loginCodes.push(record);
    return record;
  }

  async findLoginCodeById(id: string): Promise<MemberLoginCodeRecord | null> {
    return this.loginCodes.find((code) => code.id === id) ?? null;
  }

  async findActiveLoginCode(
    email: string,
    purpose: string,
    now: Date
  ): Promise<MemberLoginCodeRecord | null> {
    return (
      this.loginCodes.find(
        (code) =>
            code.email === email &&
            code.purpose === purpose &&
            code.consumedAt === null &&
            code.expiresAt > now
      ) ?? null
    );
  }

  createOrGetActivePasswordResetCode(
    input: CreateMemberLoginCodeInput,
    now: Date
  ): Promise<PasswordResetChallengeResult> {
    return this.withRegistrationLock(async () => {
      const existing = await this.findActiveLoginCode(
        input.email,
        "password_reset",
        now
      );
      if (existing) {
        return { status: "existing", code: existing };
      }
      const created = await this.createLoginCode(input);
      return { status: "created", code: created };
    });
  }

  async consumeLoginCode(id: string, consumedAt: Date): Promise<void> {
    const code = this.loginCodes.find((record) => record.id === id);
    if (code) {
      code.consumedAt = consumedAt;
    }
  }

  async createSession(input: CreateMemberSessionInput): Promise<void> {
    await this.withRegistrationLock(async () => {
      const now = new Date();
      for (const session of this.sessions.values()) {
        if (
          session.userId === input.userId &&
          session.ipAddress === input.ipAddress &&
          session.userAgent === input.userAgent &&
          session.revokedAt === null &&
          session.expiresAt > now
        ) {
          session.revokedAt = now;
        }
      }
      this.sessions.set(input.tokenId, { ...input, revokedAt: null });
    });
  }

  async isSessionActive(tokenId: string): Promise<boolean> {
    const session = this.sessions.get(tokenId);
    return Boolean(
      session &&
        session.revokedAt === null &&
        session.expiresAt.getTime() > Date.now()
    );
  }

  async revokeSession(tokenId: string, revokedAt: Date): Promise<void> {
    const session = this.sessions.get(tokenId);
    if (session) {
      session.revokedAt = revokedAt;
    }
  }

  private async withRegistrationLock<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.registrationLock;
    let release = () => {};
    this.registrationLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
