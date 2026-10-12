import { and, eq, isNull } from "drizzle-orm";

import type { AppDb } from "../../../shared/db/client.js";
import {
  adminAccessTokenRevocations,
  adminRefreshTokens,
  adminUsers
} from "../../../shared/db/schema.js";
import type {
  AccessTokenRevocationInput,
  AdminAuthRepository,
  AdminUserRecord,
  CreateAdminUserInput,
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  UpdateAdminUserInput
} from "./admin-auth.repository.js";

export class PostgresAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly db: AppDb) {}

  async listUsers(): Promise<AdminUserRecord[]> {
    const rows = await this.db
      .select()
      .from(adminUsers)
      .orderBy(adminUsers.email);
    return rows.map(userFromRow);
  }

  async findUserByEmail(email: string): Promise<AdminUserRecord | null> {
    const [row] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizeEmail(email)))
      .limit(1);
    return row ? userFromRow(row) : null;
  }

  async findUserById(id: string): Promise<AdminUserRecord | null> {
    const [row] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    return row ? userFromRow(row) : null;
  }

  async createUser(input: CreateAdminUserInput): Promise<AdminUserRecord> {
    const now = new Date();
    const [row] = await this.db
      .insert(adminUsers)
      .values({
        email: normalizeEmail(input.email),
        name: input.name,
        role: input.role,
        status: input.status,
        passwordHash: input.passwordHash,
        passwordUpdatedAt: now,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create admin user.");
    }
    return userFromRow(row);
  }

  async updateUser(
    adminUserId: string,
    input: UpdateAdminUserInput
  ): Promise<AdminUserRecord | null> {
    const [row] = await this.db
      .update(adminUsers)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, adminUserId))
      .returning();
    return row ? userFromRow(row) : null;
  }

  async setUserPassword(
    adminUserId: string,
    passwordHash: string,
    updatedAt: Date
  ): Promise<void> {
    await this.db
      .update(adminUsers)
      .set({
        passwordHash,
        passwordUpdatedAt: updatedAt,
        updatedAt
      })
      .where(eq(adminUsers.id, adminUserId));
  }

  async recordLogin(adminUserId: string, loggedInAt: Date): Promise<void> {
    await this.db
      .update(adminUsers)
      .set({ lastLoginAt: loggedInAt, updatedAt: loggedInAt })
      .where(eq(adminUsers.id, adminUserId));
  }

  async createRefreshToken(
    input: CreateRefreshTokenInput
  ): Promise<RefreshTokenRecord> {
    const [row] = await this.db
      .insert(adminRefreshTokens)
      .values({
        adminUserId: input.adminUserId,
        tokenHash: input.tokenHash,
        familyId: input.familyId,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create admin refresh token.");
    }
    return refreshTokenFromRow(row);
  }

  async findRefreshTokenByHash(
    tokenHash: string
  ): Promise<RefreshTokenRecord | null> {
    const [row] = await this.db
      .select()
      .from(adminRefreshTokens)
      .where(eq(adminRefreshTokens.tokenHash, tokenHash))
      .limit(1);
    return row ? refreshTokenFromRow(row) : null;
  }

  async revokeRefreshToken(
    tokenId: string,
    revokedAt: Date,
    reason: string,
    replacedByTokenId?: string
  ): Promise<void> {
    await this.db
      .update(adminRefreshTokens)
      .set({
        revokedAt,
        revokedReason: reason,
        replacedByTokenId
      })
      .where(eq(adminRefreshTokens.id, tokenId));
  }

  async revokeRefreshTokenFamily(
    familyId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void> {
    await this.db
      .update(adminRefreshTokens)
      .set({ revokedAt, revokedReason: reason })
      .where(
        and(
          eq(adminRefreshTokens.familyId, familyId),
          isNull(adminRefreshTokens.revokedAt)
        )
      );
  }

  async revokeRefreshTokensForUser(
    adminUserId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void> {
    await this.db
      .update(adminRefreshTokens)
      .set({ revokedAt, revokedReason: reason })
      .where(
        and(
          eq(adminRefreshTokens.adminUserId, adminUserId),
          isNull(adminRefreshTokens.revokedAt)
        )
      );
  }

  async createAccessTokenRevocation(
    input: AccessTokenRevocationInput
  ): Promise<void> {
    await this.db
      .insert(adminAccessTokenRevocations)
      .values({
        tokenId: input.tokenId,
        adminUserId: input.adminUserId,
        expiresAt: input.expiresAt,
        reason: input.reason
      })
      .onConflictDoNothing();
  }

  async isAccessTokenRevoked(tokenId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ tokenId: adminAccessTokenRevocations.tokenId })
      .from(adminAccessTokenRevocations)
      .where(eq(adminAccessTokenRevocations.tokenId, tokenId))
      .limit(1);
    return Boolean(row);
  }
}

type AdminUserRow = typeof adminUsers.$inferSelect;
type RefreshTokenRow = typeof adminRefreshTokens.$inferSelect;

function userFromRow(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    passwordHash: row.passwordHash,
    passwordUpdatedAt: row.passwordUpdatedAt,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function refreshTokenFromRow(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    adminUserId: row.adminUserId,
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    revokedReason: row.revokedReason,
    replacedByTokenId: row.replacedByTokenId,
    createdAt: row.createdAt
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
