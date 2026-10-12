import type {
  MemberAuthRegisterRequest,
  MemberAuthRegisterResponse,
  MemberAuthLoginRequest,
  MemberFirebaseAuthRequest,
  MemberFirebaseAuthResponse,
  MemberPasswordResetConfirmRequest,
  MemberPasswordResetRequest,
  MemberAuthRequestCodeResponse,
  MemberAuthSession,
  MemberAuthVerifyCodeRequest,
  MemberAuthVerifyCodeResponse,
  MemberRegistrationSettings,
  MemberProfile
} from "@mbc/api-contracts";
import { createHmac, randomInt, randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { AppConfig } from "../../../config/env.js";
import type { TokenContext } from "../../admin/auth/admin-auth.service.js";
import type { AuditService } from "../../audit/audit.service.js";
import {
  memberAccountInactive,
  memberCredentialsInvalid,
  memberEmailVerificationUnavailable,
  memberFirebaseAuthUnavailable,
  memberFirebaseIdentityConflict,
  memberFirebaseProviderUnavailable,
  memberFirebaseTokenInvalid,
  memberLoginCodeInvalid,
  memberRegistrationClosed,
  memberRegistrationUnavailable,
  memberSessionInvalid
} from "./member-auth-errors.js";
import type { MemberAuthRepository } from "./member-auth.repository.js";
import type { MemberEmailVerificationProvider } from "./member-email-verification.provider.js";
import {
  FirebaseIdentityProviderUnavailableError,
  InvalidFirebaseTokenError,
  UnverifiedFirebaseEmailError,
  UnsupportedFirebaseProviderError,
  type FirebaseIdentityVerifier,
  type VerifiedFirebaseIdentity
} from "./firebase-identity.verifier.js";
import type { SettingsService } from "../../settings/settings.service.js";
import {
  hashPassword,
  verifyPassword
} from "../../../shared/security/password-hasher.js";

const codeExpiresInSeconds = 10 * 60;
const resendAfterSeconds = 60;
const accessTokenExpiresInSeconds = 60 * 60 * 24 * 30;
const maxVerificationCodeAttempts = 5;

type MemberTokenPayload = {
  sub: string;
  email: string;
  jti: string;
  type: "member_access";
};

export type VerifiedMemberAccessToken = {
  member: MemberProfile;
  tokenId: string;
  expiresAt: Date;
};

export class MemberAuthService {
  constructor(
    private readonly config: AppConfig,
    private readonly repository: MemberAuthRepository,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly emailVerificationProvider?: MemberEmailVerificationProvider,
    private readonly firebaseIdentityVerifier?: FirebaseIdentityVerifier
  ) {}

  async getRegistrationSettings(): Promise<MemberRegistrationSettings> {
    const [mode, requireEmailVerification, requireAdminApproval, helpText] =
      await Promise.all([
        this.settingValue("member.registrationMode", "open"),
        this.settingValue("member.requireEmailVerification", true),
        this.settingValue("member.requireAdminApproval", false),
        this.settingValue("member.registrationHelpText", "")
      ]);
    return {
      mode: mode === "closed" || mode === "admin_only" ? mode : "open",
      requireEmailVerification: Boolean(requireEmailVerification),
      requireAdminApproval: Boolean(requireAdminApproval),
      helpText: typeof helpText === "string" ? helpText : ""
    };
  }

  async register(
    input: MemberAuthRegisterRequest,
    context: TokenContext
  ): Promise<MemberAuthRegisterResponse> {
    const settings = await this.getRegistrationSettings();
    const email = normalizeEmail(input.email);
    if (settings.mode !== "open") {
      throw memberRegistrationClosed(settings.mode);
    }
    const existingMember = await this.repository.findMemberByEmail(email);
    if (existingMember) {
      throw memberRegistrationUnavailable();
    }
    const displayName =
      input.displayName?.trim() || displayNameFromEmail(email);
    const passwordHash = await hashPassword(input.password);

    if (settings.requireEmailVerification) {
      if (!this.emailVerificationProvider) {
        throw memberEmailVerificationUnavailable();
      }
      const verification = await this.createRegistrationCode({
        email,
        displayName: input.displayName?.trim() || null,
        passwordHash
      });
      try {
        await this.emailVerificationProvider.sendVerificationCode({
          email,
          code: verification.code,
          expiresInSeconds: codeExpiresInSeconds,
          purpose: "registration"
        });
      } catch (error) {
        await this.repository.consumeLoginCode(
          verification.response.challengeId,
          new Date()
        );
        throw error;
      }
      return {
        status: "pending_email_verification",
        codeRequest: verification.response,
        registrationSettings: settings
      };
    }

    const creation = await this.repository.createMemberWithPassword({
      member: registrationMemberInput(
        email,
        displayName,
        settings.requireAdminApproval
      ),
      passwordHash,
      passwordUpdatedAt: new Date()
    });
    if (creation.status === "email_conflict") {
      throw memberRegistrationUnavailable();
    }
    const member = creation.member;
    if (member.status !== "active") {
      return {
        status: "pending_approval",
        member,
        registrationSettings: settings
      };
    }
    return {
      status: "signed_in",
      session: await this.createSession(member, context),
      registrationSettings: settings
    };
  }

  async login(
    input: MemberAuthLoginRequest,
    context: TokenContext
  ): Promise<MemberAuthSession> {
    const email = normalizeEmail(input.email);
    const credential = await this.repository.findPasswordCredentialByEmail(
      email
    );
    if (!credential?.passwordHash) {
      throw memberCredentialsInvalid();
    }
    if (!(await verifyPassword(input.password, credential.passwordHash))) {
      throw memberCredentialsInvalid();
    }
    const member = await this.repository.findMemberById(credential.userId);
    if (!member || member.status !== "active") {
      throw memberAccountInactive();
    }
    return this.createSession(member, context);
  }

  async signInWithFirebase(
    input: MemberFirebaseAuthRequest,
    context: TokenContext
  ): Promise<MemberFirebaseAuthResponse> {
    if (!this.firebaseIdentityVerifier) {
      throw memberFirebaseAuthUnavailable();
    }
    let identity: VerifiedFirebaseIdentity;
    try {
      identity = await this.firebaseIdentityVerifier.verifyIdToken(
        input.idToken
      );
    } catch (error) {
      const reason =
        error instanceof UnsupportedFirebaseProviderError
          ? "unsupported_provider"
          : error instanceof UnverifiedFirebaseEmailError
            ? "email_unverified"
            : error instanceof InvalidFirebaseTokenError
              ? error.reason
              : null;
      if (error instanceof FirebaseIdentityProviderUnavailableError) {
        throw memberFirebaseProviderUnavailable(error.reason);
      }
      if (reason === null) {
        throw memberFirebaseProviderUnavailable("unexpected_verifier_failure");
      }
      throw memberFirebaseTokenInvalid(reason);
    }

    const settings = await this.getRegistrationSettings();
    const email = normalizeEmail(identity.email);
    const newMember =
      settings.mode === "open"
        ? registrationMemberInput(
            email,
            identity.displayName ?? displayNameFromEmail(email),
            settings.requireAdminApproval
          )
        : null;
    const resolution = await this.repository.resolveExternalIdentity({
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email,
      newMember
    });
    if (resolution.status === "registration_closed") {
      throw memberRegistrationClosed(settings.mode);
    }
    if (resolution.status === "identity_conflict") {
      throw memberFirebaseIdentityConflict();
    }
    if (resolution.identityCreated) {
      await this.auditService.record({
        actorUserId: resolution.member.id,
        action: resolution.memberCreated
          ? "member.identity.create_with_member"
          : "member.identity.link",
        resourceType: "member_external_identity",
        resourceId: `${resolution.member.id}:${identity.provider}`,
        afterJson: {
          provider: identity.provider,
          memberCreated: resolution.memberCreated
        }
      });
    }
    if (resolution.member.status === "pending") {
      return {
        status: "pending_approval",
        member: resolution.member,
        provider: identity.provider,
        registrationSettings: settings
      };
    }
    if (resolution.member.status !== "active") {
      throw memberAccountInactive();
    }
    return {
      status: "signed_in",
      session: await this.createSession(resolution.member, context),
      provider: identity.provider,
      registrationSettings: settings
    };
  }

  async requestPasswordReset(
    input: MemberPasswordResetRequest,
    _context: TokenContext
  ): Promise<MemberAuthRequestCodeResponse> {
    const email = normalizeEmail(input.email);
    const now = new Date();
    const credential = await this.repository.findPasswordCredentialByEmail(email);
    if (!credential?.passwordHash || credential.status !== "active") {
      return dummyPasswordResetResponse(email, now);
    }
    if (!this.emailVerificationProvider) {
      throw memberEmailVerificationUnavailable();
    }
    const challengeId = randomUUID();
    const code = randomInt(100000, 1000000).toString();
    const challenge = await this.repository.createOrGetActivePasswordResetCode(
      {
        id: challengeId,
        email,
        purpose: "password_reset",
        codeHash: hashCode(this.config.appUserAuthSecret, challengeId, email, code),
        expiresAt: new Date(now.getTime() + codeExpiresInSeconds * 1000)
      },
      now
    );
    if (challenge.status === "existing") {
      return passwordResetResponse(challenge.code, this.config.nodeEnv);
    }
    const response = passwordResetResponse(challenge.code, this.config.nodeEnv, code);
    try {
      await this.emailVerificationProvider.sendVerificationCode({
        email,
        code,
        expiresInSeconds: codeExpiresInSeconds,
        purpose: "password_reset"
      });
    } catch (error) {
      await this.repository.consumeLoginCode(challenge.code.id, new Date());
      throw error;
    }
    return response;
  }

  async confirmPasswordReset(
    input: MemberPasswordResetConfirmRequest
  ): Promise<{ accepted: true }> {
    const code = await this.repository.findLoginCodeById(input.challengeId);
    if (!code || code.purpose !== "password_reset") {
      throw memberLoginCodeInvalid();
    }
    const completion = await this.repository.completePasswordReset({
      challengeId: input.challengeId,
      completedAt: new Date(),
      codeHash: hashCode(
        this.config.appUserAuthSecret,
        input.challengeId,
        normalizeEmail(code.email),
        input.code
      ),
      passwordHash: await hashPassword(input.password),
      maxFailedAttempts: maxVerificationCodeAttempts
    });
    if (completion.status !== "completed") {
      throw memberLoginCodeInvalid();
    }
    return { accepted: true };
  }

  async verifyCode(
    input: MemberAuthVerifyCodeRequest,
    context: TokenContext
  ): Promise<MemberAuthVerifyCodeResponse> {
    const loginCode = await this.repository.findLoginCodeById(
      input.challengeId
    );
    if (!loginCode) {
      throw memberLoginCodeInvalid();
    }
    const now = new Date();
    const settings = await this.getRegistrationSettings();
    if (settings.mode !== "open") {
      throw memberRegistrationClosed(settings?.mode ?? "closed");
    }
    const email = normalizeEmail(loginCode.email);
    const completion = await this.repository.completeRegistration({
      challengeId: loginCode.id,
      completedAt: now,
      codeHash: hashCode(
        this.config.appUserAuthSecret,
        loginCode.id,
        loginCode.email,
        input.code
      ),
      maxFailedAttempts: maxVerificationCodeAttempts,
      member: registrationMemberInput(
        email,
        loginCode.displayName ??
          input.displayName ??
          displayNameFromEmail(email),
        settings.requireAdminApproval
      )
    });
    if (completion.status === "challenge_invalid") {
      throw memberLoginCodeInvalid();
    }
    if (completion.status === "email_conflict") {
      throw memberRegistrationUnavailable();
    }
    const member = completion.member;

    if (member.status !== "active") {
      if (settings.requireAdminApproval) {
        return {
          status: "pending_approval",
          member,
          registrationSettings: settings
        };
      }
      throw memberAccountInactive();
    }

    return this.createSession(member, context);
  }

  async verifyAccessToken(token: string): Promise<VerifiedMemberAccessToken> {
    if (this.isDebugMemberAccessToken(token)) {
      return this.verifyDebugAccessToken();
    }

    try {
      const payload = jwt.verify(
        token,
        this.config.appUserAuthSecret
      ) as MemberTokenPayload & JwtPayload;
      if (payload.type !== "member_access" || !payload.jti || !payload.exp) {
        throw memberSessionInvalid(
          "Member session is invalid or expired.",
          "invalid_payload"
        );
      }
      if (!(await this.repository.isSessionActive(payload.jti))) {
        throw memberSessionInvalid("Member session has expired.", "revoked");
      }
      const member = await this.repository.findMemberById(payload.sub);
      if (!member || member.status !== "active") {
        throw memberAccountInactive();
      }
      return {
        member,
        tokenId: payload.jti,
        expiresAt: new Date(payload.exp * 1000)
      };
    } catch (error) {
      if (isHttpError(error)) {
        throw error;
      }
      throw memberSessionInvalid(
        "Member session is invalid or expired.",
        "jwt_verify_failed"
      );
    }
  }

  async logout(tokenId: string): Promise<void> {
    if (tokenId === debugMemberTokenId) {
      return;
    }
    await this.repository.revokeSession(tokenId, new Date());
  }

  private async createSession(
    member: MemberProfile,
    context: TokenContext
  ): Promise<MemberAuthSession> {
    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + accessTokenExpiresInSeconds * 1000);
    await this.repository.createSession({
      userId: member.id,
      tokenId,
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    const accessToken = jwt.sign(
      {
        sub: member.id,
        email: member.email,
        jti: tokenId,
        type: "member_access"
      } satisfies MemberTokenPayload,
      this.config.appUserAuthSecret,
      { expiresIn: accessTokenExpiresInSeconds }
    );
    return {
      accessToken,
      expiresInSeconds: accessTokenExpiresInSeconds,
      member
    };
  }

  private async createRegistrationCode(input: {
    email: string;
    displayName: string | null;
    passwordHash: string;
  }): Promise<{ code: string; response: MemberAuthRequestCodeResponse }> {
    const email = normalizeEmail(input.email);
    const challengeId = randomUUID();
    const code = randomInt(100000, 1000000).toString();
    await this.repository.createLoginCode({
      id: challengeId,
      email,
      purpose: "registration_email_verification",
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      codeHash: hashCode(
        this.config.appUserAuthSecret,
        challengeId,
        email,
        code
      ),
      expiresAt: new Date(Date.now() + codeExpiresInSeconds * 1000)
    });

    return {
      code,
      response: {
        accepted: true,
        challengeId,
        delivery: "email",
        maskedEmail: maskEmail(email),
        expiresInSeconds: codeExpiresInSeconds,
        resendAfterSeconds,
        ...(this.config.nodeEnv === "production"
          ? {}
          : { devCode: code })
      }
    };
  }

  private async settingValue(key: string, fallback: unknown) {
    const setting = await this.settingsService.getByKey(key);
    return setting?.value ?? fallback;
  }

  private isDebugMemberAccessToken(token: string): boolean {
    return (
      this.config.nodeEnv !== "production" &&
      this.config.debugMemberAuthBypass &&
      token === this.config.debugMemberAccessToken
    );
  }

  private async verifyDebugAccessToken(): Promise<VerifiedMemberAccessToken> {
    const email = normalizeEmail(this.config.debugMemberEmail);
    const existingMember = await this.repository.findMemberByEmail(email);
    const member =
      existingMember ??
      (await this.repository.createMember({
        email,
        displayName: this.config.debugMemberDisplayName,
        status: "active",
        roles: ["member"],
        appLocale: "en",
        fellowshipGroupId: "friday-fellowship",
        notificationSettings: {
          weeklyBulletin: true,
          sermonPublished: true,
          lifePostPublished: true,
          prayerUpdates: true
        }
      }));

    if (member.status !== "active") {
      throw memberAccountInactive();
    }

    return {
      member,
      tokenId: debugMemberTokenId,
      expiresAt: new Date(Date.now() + accessTokenExpiresInSeconds * 1000)
    };
  }
}

const debugMemberTokenId = "debug-member-access-token";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(
  secret: string,
  challengeId: string,
  email: string,
  code: string
) {
  return createHmac("sha256", secret)
    .update(`${challengeId}:${email}:${code}`)
    .digest("base64url");
}

function displayNameFromEmail(email: string) {
  return email.split("@")[0] || "Member";
}

function registrationMemberInput(
  email: string,
  displayName: string,
  requireAdminApproval: boolean
) {
  return {
    email,
    displayName,
    status: requireAdminApproval ? ("pending" as const) : ("active" as const),
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

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  const visiblePrefix = localPart.slice(0, 1);
  const maskedLocal = localPart.length <= 1 ? "*" : `${visiblePrefix}***`;
  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

function passwordResetResponse(
  challenge: { id: string; email: string; expiresAt: Date },
  nodeEnv: string,
  devCode?: string
): MemberAuthRequestCodeResponse {
  return {
    accepted: true,
    challengeId: challenge.id,
    delivery: "email",
    maskedEmail: maskEmail(challenge.email),
    expiresInSeconds: Math.max(
      1,
      Math.ceil((challenge.expiresAt.getTime() - Date.now()) / 1000)
    ),
    resendAfterSeconds,
    ...(nodeEnv === "production" || !devCode ? {} : { devCode })
  };
}

function dummyPasswordResetResponse(
  email: string,
  now: Date
): MemberAuthRequestCodeResponse {
  return passwordResetResponse(
    {
      id: randomUUID(),
      email,
      expiresAt: new Date(now.getTime() + codeExpiresInSeconds * 1000)
    },
    "production"
  );
}

function isHttpError(error: unknown): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  );
}
