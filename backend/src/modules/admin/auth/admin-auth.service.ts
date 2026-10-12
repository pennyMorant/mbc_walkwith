import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminPermission,
  AdminRefreshTokenResponse,
  AdminRole,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUser
} from "@mbc/api-contracts";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { AppConfig } from "../../../config/env.js";
import type { AdminAuthRepository, AdminUserRecord } from "./admin-auth.repository.js";
import {
  adminCredentialsInvalid,
  adminCurrentPasswordInvalid,
  adminRefreshTokenInvalid,
  adminSessionInvalid,
  adminUserEmailConflict,
  adminUserInactive
} from "./admin-auth-errors.js";
import { permissionsForRole, roleHasPermission } from "./admin-rbac.js";
import { hashPassword, verifyPassword } from "./password-hasher.js";

const accessTokenExpiresInSeconds = 15 * 60;
const refreshTokenExpiresInSeconds = 60 * 60 * 24 * 30;

type AdminTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminUser["status"];
  jti: string;
  type: "admin_access";
};

export type VerifiedAdminAccessToken = {
  user: AdminUser;
  tokenId: string;
  expiresAt: Date;
};

export type TokenContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export class AdminAuthService {
  constructor(
    private readonly config: AppConfig,
    private readonly repository: AdminAuthRepository
  ) {}

  get isProduction() {
    return this.config.nodeEnv === "production";
  }

  async bootstrapDevAdmin(): Promise<void> {
    const existing = await this.repository.findUserByEmail(
      this.config.devAdminEmail
    );
    if (existing) {
      if (!existing.passwordHash) {
        await this.repository.setUserPassword(
          existing.id,
          await hashPassword(this.config.devAdminPassword),
          new Date()
        );
      }
      return;
    }

    await this.repository.createUser({
      email: this.config.devAdminEmail,
      name: "Development Admin",
      role: "owner",
      status: "active",
      passwordHash: await hashPassword(this.config.devAdminPassword)
    });
  }

  async login(
    input: AdminLoginRequest,
    context: TokenContext
  ): Promise<AdminLoginResponse> {
    const user = await this.repository.findUserByEmail(input.email);
    if (
      !user ||
      user.status !== "active" ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      throw adminCredentialsInvalid();
    }

    await this.repository.recordLogin(user.id, new Date());
    return this.createSession(user, randomUUID(), context);
  }

  async listUsers(): Promise<AdminUser[]> {
    const users = await this.repository.listUsers();
    return users.map(toAdminUser);
  }

  async listActiveUsersWithPermission(
    permission: AdminPermission
  ): Promise<AdminUser[]> {
    const users = await this.repository.listUsers();
    return users
      .filter(
        (user) =>
          user.status === "active" && roleHasPermission(user.role, permission)
      )
      .map(toAdminUser);
  }

  async findActiveUserWithPermission(
    adminUserId: string,
    permission: AdminPermission
  ): Promise<AdminUser | null> {
    const user = await this.repository.findUserById(adminUserId);
    return user?.status === "active" && roleHasPermission(user.role, permission)
      ? toAdminUser(user)
      : null;
  }

  async createUser(input: AdminCreateUserRequest): Promise<AdminUser> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw adminUserEmailConflict(input.email);
    }

    const user = await this.repository.createUser({
      email: input.email,
      name: input.name,
      role: input.role,
      status: "active",
      passwordHash: await hashPassword(input.password)
    });
    return toAdminUser(user);
  }

  async updateUser(
    adminUserId: string,
    input: AdminUpdateUserRequest
  ): Promise<AdminUser | null> {
    const updated = await this.repository.updateUser(adminUserId, input);
    if (updated && input.status === "disabled") {
      await this.repository.revokeRefreshTokensForUser(
        adminUserId,
        new Date(),
        "admin_user_disabled"
      );
    }
    return updated ? toAdminUser(updated) : null;
  }

  async resetPassword(
    adminUserId: string,
    password: string
  ): Promise<AdminUser | null> {
    const user = await this.repository.findUserById(adminUserId);
    if (!user) {
      return null;
    }

    await this.repository.setUserPassword(
      adminUserId,
      await hashPassword(password),
      new Date()
    );
    await this.repository.revokeRefreshTokensForUser(
      adminUserId,
      new Date(),
      "password_reset"
    );

    const updated = await this.repository.findUserById(adminUserId);
    return updated ? toAdminUser(updated) : null;
  }

  async changePassword(
    adminUserId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AdminUser> {
    const user = await this.repository.findUserById(adminUserId);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw adminCurrentPasswordInvalid();
    }

    await this.repository.setUserPassword(
      adminUserId,
      await hashPassword(newPassword),
      new Date()
    );
    await this.repository.revokeRefreshTokensForUser(
      adminUserId,
      new Date(),
      "password_changed"
    );

    const updated = await this.repository.findUserById(adminUserId);
    return toAdminUser(updated ?? user);
  }

  async refresh(
    refreshToken: string,
    context: TokenContext
  ): Promise<AdminRefreshTokenResponse> {
    const tokenHash = hashToken(refreshToken);
    const existingToken = await this.repository.findRefreshTokenByHash(tokenHash);
    if (!existingToken) {
      throw adminRefreshTokenInvalid(
        "not_found",
        "Admin refresh token is invalid."
      );
    }

    const now = new Date();
    if (existingToken.revokedAt !== null) {
      await this.repository.revokeRefreshTokenFamily(
        existingToken.familyId,
        now,
        "refresh_token_reuse"
      );
      throw adminRefreshTokenInvalid(
        "revoked",
        "Admin refresh token has been revoked."
      );
    }

    if (existingToken.expiresAt.getTime() <= now.getTime()) {
      await this.repository.revokeRefreshToken(
        existingToken.id,
        now,
        "refresh_token_expired"
      );
      throw adminRefreshTokenInvalid(
        "expired",
        "Admin refresh token has expired."
      );
    }

    const user = await this.repository.findUserById(existingToken.adminUserId);
    if (!user || user.status !== "active") {
      await this.repository.revokeRefreshTokenFamily(
        existingToken.familyId,
        now,
        "admin_user_inactive"
      );
      throw adminUserInactive();
    }

    const session = await this.createSession(
      user,
      existingToken.familyId,
      context
    );
    const replacement = await this.repository.findRefreshTokenByHash(
      hashToken(session.refreshToken)
    );
    await this.repository.revokeRefreshToken(
      existingToken.id,
      now,
      "refresh_token_rotated",
      replacement?.id
    );
    return session;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const existingToken = await this.repository.findRefreshTokenByHash(
      hashToken(refreshToken)
    );
    if (!existingToken || existingToken.revokedAt !== null) {
      return;
    }
    await this.repository.revokeRefreshToken(
      existingToken.id,
      new Date(),
      "logout"
    );
  }

  async revokeAccessToken(
    tokenId: string,
    adminUserId: string,
    expiresAt: Date,
    reason: string
  ): Promise<void> {
    await this.repository.createAccessTokenRevocation({
      tokenId,
      adminUserId,
      expiresAt,
      reason
    });
  }

  async verifyAccessToken(token: string): Promise<VerifiedAdminAccessToken> {
    try {
      const payload = jwt.verify(
        token,
        this.config.authSecret
      ) as AdminTokenPayload & JwtPayload;

      if (payload.type !== "admin_access" || !payload.jti || !payload.exp) {
        throw adminSessionInvalid(
          "Admin session is invalid or expired.",
          "invalid_payload"
        );
      }

      if (await this.repository.isAccessTokenRevoked(payload.jti)) {
        throw adminSessionInvalid("Admin session has been revoked.", "revoked");
      }

      const currentUser = await this.repository.findUserById(payload.sub);
      if (!currentUser || currentUser.status !== "active") {
        throw adminUserInactive();
      }

      return {
        tokenId: payload.jti,
        expiresAt: new Date(payload.exp * 1000),
        user: toAdminUser(currentUser)
      };
    } catch (error) {
      if (isHttpError(error)) {
        throw error;
      }
      throw adminSessionInvalid(
        "Admin session is invalid or expired.",
        "jwt_verify_failed"
      );
    }
  }

  private async createSession(
    user: AdminUserRecord,
    familyId: string,
    context: TokenContext
  ): Promise<AdminLoginResponse> {
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshTokenRecord = await this.repository.createRefreshToken({
      adminUserId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + refreshTokenExpiresInSeconds * 1000),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        jti: randomUUID(),
        type: "admin_access"
      } satisfies AdminTokenPayload,
      this.config.authSecret,
      { expiresIn: accessTokenExpiresInSeconds }
    );

    void refreshTokenRecord;

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: accessTokenExpiresInSeconds,
      user: toAdminUser(user),
      permissions: permissionsForRole(user.role)
    };
  }
}

export function permissionsForUser(user: AdminUser): AdminPermission[] {
  return permissionsForRole(user.role);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function toAdminUser(user: AdminUserRecord): AdminUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

function isHttpError(error: unknown): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  );
}
