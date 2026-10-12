import type { AdminRole, AdminUser, AdminUserStatus } from "@mbc/api-contracts";

export type AdminUserRecord = AdminUser & {
  passwordHash: string;
  passwordUpdatedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdminUserInput = {
  email: string;
  name: string;
  role: AdminRole;
  status: AdminUserStatus;
  passwordHash: string;
};

export type UpdateAdminUserInput = {
  name?: string | undefined;
  role?: AdminRole | undefined;
  status?: AdminUserStatus | undefined;
};

export type CreateRefreshTokenInput = {
  adminUserId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type RefreshTokenRecord = {
  id: string;
  adminUserId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  replacedByTokenId: string | null;
  createdAt: Date;
};

export type AccessTokenRevocationInput = {
  tokenId: string;
  adminUserId: string;
  expiresAt: Date;
  reason: string;
};

export interface AdminAuthRepository {
  listUsers(): Promise<AdminUserRecord[]>;
  findUserByEmail(email: string): Promise<AdminUserRecord | null>;
  findUserById(id: string): Promise<AdminUserRecord | null>;
  createUser(input: CreateAdminUserInput): Promise<AdminUserRecord>;
  updateUser(
    adminUserId: string,
    input: UpdateAdminUserInput
  ): Promise<AdminUserRecord | null>;
  setUserPassword(
    adminUserId: string,
    passwordHash: string,
    updatedAt: Date
  ): Promise<void>;
  recordLogin(adminUserId: string, loggedInAt: Date): Promise<void>;
  createRefreshToken(
    input: CreateRefreshTokenInput
  ): Promise<RefreshTokenRecord>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(
    tokenId: string,
    revokedAt: Date,
    reason: string,
    replacedByTokenId?: string
  ): Promise<void>;
  revokeRefreshTokenFamily(
    familyId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void>;
  revokeRefreshTokensForUser(
    adminUserId: string,
    revokedAt: Date,
    reason: string
  ): Promise<void>;
  createAccessTokenRevocation(input: AccessTokenRevocationInput): Promise<void>;
  isAccessTokenRevoked(tokenId: string): Promise<boolean>;
}
