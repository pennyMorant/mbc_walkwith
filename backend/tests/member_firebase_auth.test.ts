import { describe, expect, it } from "vitest";

import { InMemoryMemberRepository } from "../src/modules/members/in-memory-member.repository.js";
import type {
  FirebaseIdentityVerifier,
  VerifiedFirebaseIdentity
} from "../src/modules/members/auth/firebase-identity.verifier.js";
import {
  FirebaseIdentityProviderUnavailableError,
  InvalidFirebaseTokenError
} from "../src/modules/members/auth/firebase-identity.verifier.js";
import { AuditService } from "../src/modules/audit/audit.service.js";
import { InMemoryAuditRepository } from "../src/modules/audit/in-memory-audit.repository.js";
import { InMemoryMemberAuthRepository } from "../src/modules/members/auth/in-memory-member-auth.repository.js";
import { MemberAuthService } from "../src/modules/members/auth/member-auth.service.js";
import { InMemorySettingsRepository } from "../src/modules/settings/in-memory-settings.repository.js";
import { SettingsService } from "../src/modules/settings/settings.service.js";
import { testConfig } from "./route_test_harness.js";

const context = { ipAddress: "127.0.0.1", userAgent: "vitest" };

describe("member Firebase authentication", () => {
  it("creates, links, and reuses backend members from verified identities", async () => {
    const verifier = new FakeFirebaseIdentityVerifier({
      google: identity("google", "firebase-google", "federated@example.com"),
      apple: identity("apple", "firebase-apple", "federated@example.com")
    });
    const auditRepository = new InMemoryAuditRepository();
    const service = createService(
      verifier,
      new InMemorySettingsRepository(),
      auditRepository
    );

    const first = await service.signInWithFirebase(
      { idToken: "google" },
      context
    );
    expect(first.status).toBe("signed_in");
    if (first.status !== "signed_in") throw new Error("expected session");

    const repeated = await service.signInWithFirebase(
      { idToken: "google" },
      context
    );
    const linkedApple = await service.signInWithFirebase(
      { idToken: "apple" },
      context
    );
    expect(repeated.status).toBe("signed_in");
    expect(linkedApple.status).toBe("signed_in");
    if (repeated.status !== "signed_in" || linkedApple.status !== "signed_in") {
      throw new Error("expected linked sessions");
    }
    expect(repeated.session.member.id).toBe(first.session.member.id);
    expect(linkedApple.session.member.id).toBe(first.session.member.id);
    expect(auditRepository.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "member.identity.create_with_member",
          actorUserId: first.session.member.id,
          afterJson: { provider: "google", memberCreated: true }
        }),
        expect.objectContaining({
          action: "member.identity.link",
          actorUserId: first.session.member.id,
          afterJson: { provider: "apple", memberCreated: false }
        })
      ])
    );
    expect(auditRepository.logs).toHaveLength(2);
    await expect(
      service.verifyAccessToken(first.session.accessToken)
    ).rejects.toMatchObject({ code: "member_session_invalid" });
  });

  it("honors registration closure and admin approval for new identities", async () => {
    const verifier = new FakeFirebaseIdentityVerifier({
      known: identity("google", "known-id", "known@example.com"),
      pending: identity("apple", "pending-id", "pending@example.com"),
      closed: identity("google", "closed-id", "closed@example.com")
    });
    const settingsRepository = new InMemorySettingsRepository();
    const service = createService(verifier, settingsRepository);

    const known = await service.signInWithFirebase({ idToken: "known" }, context);
    expect(known.status).toBe("signed_in");

    await settingsRepository.update("member.requireAdminApproval", {
      value: true
    });
    const pending = await service.signInWithFirebase(
      { idToken: "pending" },
      context
    );
    expect(pending.status).toBe("pending_approval");

    await settingsRepository.update("member.registrationMode", {
      value: "closed"
    });
    await expect(
      service.signInWithFirebase({ idToken: "closed" }, context)
    ).rejects.toMatchObject({ code: "member_registration_closed" });
    await expect(
      service.signInWithFirebase({ idToken: "known" }, context)
    ).resolves.toMatchObject({ status: "signed_in" });
  });

  it("rejects unverified tokens and ambiguous same-provider linking", async () => {
    const verifier = new FakeFirebaseIdentityVerifier({
      first: identity("google", "first-id", "conflict@example.com"),
      second: identity("google", "second-id", "conflict@example.com")
    });
    const service = createService(verifier);
    await service.signInWithFirebase({ idToken: "first" }, context);

    await expect(
      service.signInWithFirebase({ idToken: "second" }, context)
    ).rejects.toMatchObject({ code: "member_firebase_identity_conflict" });
    await expect(
      service.signInWithFirebase({ idToken: "missing" }, context)
    ).rejects.toMatchObject({
      code: "member_firebase_token_invalid",
      evidence: { reason: "auth/invalid-id-token" }
    });
  });

  it("returns a retryable provider error for Firebase outages", async () => {
    const service = createService(
      new ThrowingFirebaseIdentityVerifier(
        new FirebaseIdentityProviderUnavailableError("auth/internal-error")
      )
    );

    await expect(
      service.signInWithFirebase({ idToken: "firebase-outage" }, context)
    ).rejects.toMatchObject({
      code: "member_firebase_provider_unavailable",
      statusCode: 503,
      retryable: true,
      evidence: { reason: "auth/internal-error" }
    });
  });
});

function createService(
  verifier: FirebaseIdentityVerifier,
  settingsRepository = new InMemorySettingsRepository(),
  auditRepository = new InMemoryAuditRepository()
) {
  const members = new InMemoryMemberRepository();
  return new MemberAuthService(
    testConfig,
    new InMemoryMemberAuthRepository(members),
    new SettingsService(settingsRepository),
    new AuditService(auditRepository),
    undefined,
    verifier
  );
}

function identity(
  provider: "google" | "apple",
  providerSubject: string,
  email: string
): VerifiedFirebaseIdentity {
  return { provider, providerSubject, email, displayName: "Firebase Member" };
}

class FakeFirebaseIdentityVerifier implements FirebaseIdentityVerifier {
  constructor(
    private readonly identities: Record<string, VerifiedFirebaseIdentity>
  ) {}

  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseIdentity> {
    const identity = this.identities[idToken];
    if (!identity) {
      throw new InvalidFirebaseTokenError("auth/invalid-id-token");
    }
    return identity;
  }
}

class ThrowingFirebaseIdentityVerifier implements FirebaseIdentityVerifier {
  constructor(private readonly error: Error) {}

  async verifyIdToken(): Promise<VerifiedFirebaseIdentity> {
    throw this.error;
  }
}
