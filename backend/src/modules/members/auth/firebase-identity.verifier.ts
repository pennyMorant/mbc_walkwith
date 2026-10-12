import type { MemberFederatedAuthProvider } from "@mbc/api-contracts";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import type { AppConfig } from "../../../config/env.js";

export type VerifiedFirebaseIdentity = {
  provider: MemberFederatedAuthProvider;
  providerSubject: string;
  email: string;
  displayName: string | null;
};

export interface FirebaseIdentityVerifier {
  verifyIdToken(idToken: string): Promise<VerifiedFirebaseIdentity>;
}

export function createFirebaseIdentityVerifier(
  config: AppConfig
): FirebaseIdentityVerifier | undefined {
  const rawCredentials = config.firebaseServiceAccountJson?.trim();
  if (!rawCredentials) {
    return undefined;
  }
  const credentials = parseServiceAccount(rawCredentials);
  const appName = "mbc-member-auth";
  const app =
    getApps().find((candidate) => candidate.name === appName) ??
    initializeApp({ credential: cert(credentials) }, appName);
  const auth = getAuth(app);
  return {
    async verifyIdToken(idToken) {
      let token;
      try {
        token = await auth.verifyIdToken(idToken, true);
      } catch (error) {
        const reason = firebaseAuthErrorCode(error);
        if (invalidTokenErrorCodes.has(reason)) {
          throw new InvalidFirebaseTokenError(reason);
        }
        throw new FirebaseIdentityProviderUnavailableError(reason);
      }
      const provider = providerFromFirebaseToken(
        token.firebase?.sign_in_provider
      );
      if (!provider) {
        throw new UnsupportedFirebaseProviderError();
      }
      if (!token.email || token.email_verified !== true) {
        throw new UnverifiedFirebaseEmailError();
      }
      return {
        provider,
        providerSubject: token.uid,
        email: token.email.trim().toLowerCase(),
        displayName:
          typeof token.name === "string" && token.name.trim()
            ? token.name.trim()
            : null
      };
    }
  };
}

export class UnsupportedFirebaseProviderError extends Error {}
export class UnverifiedFirebaseEmailError extends Error {}
export class InvalidFirebaseTokenError extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}
export class FirebaseIdentityProviderUnavailableError extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

const invalidTokenErrorCodes = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-argument",
  "auth/invalid-id-token",
  "auth/user-disabled",
  "auth/user-not-found"
]);

function firebaseAuthErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "firebase_verification_unavailable";
}

function providerFromFirebaseToken(
  value: string | undefined
): MemberFederatedAuthProvider | null {
  if (value === "google.com") return "google";
  if (value === "apple.com") return "apple";
  return null;
}

function parseServiceAccount(raw: string) {
  const parsed = JSON.parse(raw) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing required service account fields."
    );
  }
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n")
  };
}
