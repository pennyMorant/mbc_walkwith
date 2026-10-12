import { randomUUID } from "node:crypto";

import type {
  AccessTokenRevocationInput,
  AdminAuthRepository,
  AdminUserRecord,
  CreateAdminUserInput,
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  UpdateAdminUserInput
} from "./admin-auth.repository.js";

export class InMemoryAdminAuthRepository implements AdminAuthRepository {
  private users = new Map<string, AdminUserRecord>();
  private refreshTokens = new Map<string, RefreshTokenRecord>();
  private revokedAccessTokens = new Map<string, AccessTokenRevocationInput>();

  async listUsers(): Promise<AdminUserRecord[]> {
    return [...this.users.values()].sort((a, b) =>
      a.email.localeCompare(b.email)
    );
  }

  async findUserByEmail(email: string): Promise<AdminUserRecord | null> {
    const normalizedEmail = normalizeEmail(email);
    return (
      [...this.users.values()].find(
        (user) => normalizeEmail(user.email) === normalizedEmail
      ) ?? null
    );
  }

  async findUserById(id: string): Promise<AdminUserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async createUser(input: CreateAdminUserInput): Promise<AdminUserRecord> {
    const now = new Date();
    const user: AdminUserRecord = {
      id: randomUUID(),
      email: normalizeEmail(input.email),
      name: input.name,
      role: input.role,
      status: input.status,
      passwordHash: input.passwordHash,
      passwordUpdatedAt: now,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(
    adminUserId: string,
    input: UpdateAdminUserInput
  ): Promise<AdminUserRecord | null> {
    const user = this.users.get(adminUserId);
    if (!user) {
      return null;
    }
    const updated: AdminUserRecord = {
      ...user,
      name: input.name ?? user.name,
      role: input.role ?? user.role,
      status: input.status ?? user.status,
      updatedAt: new Date()
    };
    this.users.set(adminUserId, updated);
    return updated;
  }

  async setUserPassword(
    adminUserId: string,
    passwordHash: string,
    updatedAt: Date
  ): Promise<void> {
    const user = this.users.get(adminUserId);
    if (!user) {
      return;
    }
    this.users.set(adminUserId, {
      ...user,
      passwordHash,
      passwordUpdatedAt: updatedAt,
      updatedAt
    });
  }

  async recordLogin(adminUserId: string, loggedInAt: Date): Promise<void> {
    const user = this.users.get(adminUserId);
    if (!user) {
      return;
    }
    this.users.set(adminUserId, {
      ...user,
      lastLoginAt: loggedInAt,
      updatedAt: loggedInAt
    });
  }

  async createRefreshToken(
    input: CreateRefreshTokenInput
  ): Promise<RefreshTokenRecord> {
    const token: RefreshTokenRecord = {
      id: randomUUID(),
      adminUserId: input.adminUserId,
      tokenHash: input.tokenHash,
      familyId: input.familyId,
      expiresAt: input.expiresAt,
      revokedAt: null,
      revokedReason: null,
      replacedByTokenId: null,
      createdAt: new Date()
    };
    this.refreshTokens.set(token.id, token);
    return token;
  }

  async findRefreshTokenByHash(
    tokenHash: string
  ): Promise<RefreshTokenRecord | null> {
    return (
      [...this.refreshTokens.values()].find(
        (token) => token.tokenHash === tokenHash
      ) ?? null
    );
  }

  async revokeRefreshToken(
    tokenId: string,
    revokedAt: Date,
    reason: string,
    replacedByTokenId?: string
  ): Promise<void> {
    const token = this.refreshTokens.get(tokenId);
    if (!token) {
      return;
    }
    this.refreshTokens.set(tokenId, {
      ...token,
      revokedAt,
      revokedReason: reason,
      replacedByTokenId: replacedByTokenId ?? token.replacedByTokenId
    });
  }

  async revokeRefreshTokenFamily(
    familyId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void> {
    for (const token of this.refreshTokens.values()) {
      if (token.familyId === familyId && token.revokedAt === null) {
        this.refreshTokens.set(token.id, {
          ...token,
          revokedAt,
          revokedReason: reason
        });
      }
    }
  }

  async revokeRefreshTokensForUser(
    adminUserId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void> {
    for (const token of this.refreshTokens.values()) {
      if (token.adminUserId === adminUserId && token.revokedAt === null) {
        this.refreshTokens.set(token.id, {
          ...token,
          revokedAt,
          revokedReason: reason
        });
      }
    }
  }

  async createAccessTokenRevocation(
    input: AccessTokenRevocationInput
  ): Promise<void> {
    this.revokedAccessTokens.set(input.tokenId, input);
  }

  async isAccessTokenRevoked(tokenId: string): Promise<boolean> {
    const revocation = this.revokedAccessTokens.get(tokenId);
    if (!revocation) {
      return false;
    }
    if (revocation.expiresAt.getTime() <= Date.now()) {
      this.revokedAccessTokens.delete(tokenId);
      return false;
    }
    return true;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
