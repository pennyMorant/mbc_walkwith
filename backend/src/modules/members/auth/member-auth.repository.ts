import type {
  MemberCreateRequest,
  MemberFederatedAuthProvider,
  MemberProfile
} from "@mbc/api-contracts";

export type MemberLoginCodeRecord = {
  id: string;
  email: string;
  purpose: string;
  displayName: string | null;
  passwordHash: string | null;
  codeHash: string;
  failedAttempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export type CreateMemberLoginCodeInput = {
  id: string;
  email: string;
  purpose: string;
  displayName?: string | null;
  passwordHash?: string | null;
  codeHash: string;
  expiresAt: Date;
};

export type MemberPasswordCredential = {
  userId: string;
  email: string;
  status: string;
  passwordHash: string | null;
};

export type CreateMemberSessionInput = {
  userId: string;
  tokenId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type CreateMemberWithPasswordInput = {
  member: MemberCreateRequest;
  passwordHash: string;
  passwordUpdatedAt: Date;
};

export type CompleteMemberRegistrationInput = {
  challengeId: string;
  completedAt: Date;
  codeHash: string;
  maxFailedAttempts: number;
  member: MemberCreateRequest;
};

export type CompleteMemberPasswordResetInput = {
  challengeId: string;
  completedAt: Date;
  codeHash: string;
  passwordHash: string;
  maxFailedAttempts: number;
};

export type MemberCredentialCreationResult =
  | { status: "created"; member: MemberProfile }
  | { status: "email_conflict" };

export type MemberRegistrationCompletionResult =
  | MemberCredentialCreationResult
  | { status: "challenge_invalid" };

export type MemberPasswordResetCompletionResult =
  | { status: "completed" }
  | { status: "challenge_invalid" };

export type PasswordResetChallengeResult =
  | { status: "created"; code: MemberLoginCodeRecord }
  | { status: "existing"; code: MemberLoginCodeRecord };

export type ResolveExternalIdentityInput = {
  provider: MemberFederatedAuthProvider;
  providerSubject: string;
  email: string;
  newMember: MemberCreateRequest | null;
};

export type ResolveExternalIdentityResult =
  | {
      status: "resolved";
      member: MemberProfile;
      memberCreated: boolean;
      identityCreated: boolean;
    }
  | { status: "registration_closed" }
  | { status: "identity_conflict" };

export interface MemberAuthRepository {
  findMemberByEmail(email: string): Promise<MemberProfile | null>;
  findMemberById(id: string): Promise<MemberProfile | null>;
  findPasswordCredentialByEmail(
    email: string
  ): Promise<MemberPasswordCredential | null>;
  createMember(input: MemberCreateRequest): Promise<MemberProfile>;
  resolveExternalIdentity(
    input: ResolveExternalIdentityInput
  ): Promise<ResolveExternalIdentityResult>;
  createMemberWithPassword(
    input: CreateMemberWithPasswordInput
  ): Promise<MemberCredentialCreationResult>;
  completeRegistration(
    input: CompleteMemberRegistrationInput
  ): Promise<MemberRegistrationCompletionResult>;
  completePasswordReset(
    input: CompleteMemberPasswordResetInput
  ): Promise<MemberPasswordResetCompletionResult>;
  createLoginCode(
    input: CreateMemberLoginCodeInput
  ): Promise<MemberLoginCodeRecord>;
  findLoginCodeById(id: string): Promise<MemberLoginCodeRecord | null>;
  findActiveLoginCode(
    email: string,
    purpose: string,
    now: Date
  ): Promise<MemberLoginCodeRecord | null>;
  createOrGetActivePasswordResetCode(
    input: CreateMemberLoginCodeInput,
    now: Date
  ): Promise<PasswordResetChallengeResult>;
  consumeLoginCode(id: string, consumedAt: Date): Promise<void>;
  createSession(input: CreateMemberSessionInput): Promise<void>;
  isSessionActive(tokenId: string): Promise<boolean>;
  revokeSession(tokenId: string, revokedAt: Date): Promise<void>;
}
