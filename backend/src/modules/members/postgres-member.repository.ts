import {
  memberNotificationSettingsSchema,
  type MemberCreateRequest,
  type MemberListItem,
  type MemberListQuery,
  type MemberNotificationSettings,
  type MemberProfile,
  type MemberRole,
  type MemberUpdateRequest
} from "@mbc/api-contracts";
import { supportedLocales, type SupportedLocale } from "@mbc/shared-types";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { memberProfiles, users } from "../../shared/db/schema.js";
import {
  MemberEmailConflictRepositoryError,
  type MemberRepository
} from "./member.repository.js";
import { isPostgresMemberEmailConflict } from "./postgres_member_errors.js";

export class PostgresMemberRepository implements MemberRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: MemberListQuery): Promise<MemberListItem[]> {
    const filters = [
      query.status ? eq(users.status, query.status) : undefined,
      query.fellowshipGroupId
        ? eq(memberProfiles.fellowshipGroupId, query.fellowshipGroupId)
        : undefined,
      query.query
        ? or(
            ilike(users.email, `%${query.query}%`),
            ilike(users.displayName, `%${query.query}%`),
            ilike(users.phone, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        role: users.role,
        appLocale: memberProfiles.appLocale,
        fellowshipGroupId: memberProfiles.fellowshipGroupId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(users.updatedAt))
      .limit(query.limit);
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      roles: parseRoles(row.role),
      appLocale: parseLocale(row.appLocale),
      fellowshipGroupId: row.fellowshipGroupId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }));
  }

  async getById(id: string): Promise<MemberProfile | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(eq(users.id, id))
      .limit(1);
    return row ? memberFromJoinedRow(row) : null;
  }

  async listNotificationEligibleIds(
    preference: keyof MemberNotificationSettings,
    userIds?: string[]
  ): Promise<string[]> {
    if (userIds?.length === 0) {
      return [];
    }
    const rows = await this.db
      .select({
        id: users.id,
        notificationSettings: memberProfiles.notificationSettings
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(
        and(
          eq(users.status, "active"),
          userIds ? inArray(users.id, userIds) : undefined
        )
      );
    return rows
      .filter(
        (row) => normalizeNotifications(row.notificationSettings)[preference]
      )
      .map((row) => row.id);
  }

  async getByEmail(email: string): Promise<MemberProfile | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return row ? memberFromJoinedRow(row) : null;
  }

  async create(input: MemberCreateRequest): Promise<MemberProfile> {
    const now = new Date();
    try {
      return await this.db.transaction(async (transaction) => {
        const [userRow] = await transaction
          .insert(users)
          .values({
            email: input.email.trim().toLowerCase(),
            displayName: input.displayName,
            phone: input.phone ?? null,
            role: (input.roles ?? ["member"]).join(","),
            status: input.status ?? "active",
            updatedAt: now
          })
          .returning();
        if (!userRow) {
          throw new Error("Failed to create member.");
        }

        const [profileRow] = await transaction
          .insert(memberProfiles)
          .values(profileValues(userRow.id, input))
          .returning();
        if (!profileRow) {
          throw new Error("Failed to create member profile.");
        }
        return memberFromRows(userRow, profileRow);
      });
    } catch (error) {
      if (isPostgresMemberEmailConflict(error)) {
        throw new MemberEmailConflictRepositoryError(input.email);
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: MemberUpdateRequest
  ): Promise<MemberProfile | null> {
    try {
      return await this.db.transaction(async (transaction) => {
        const [lockedRow] = await transaction
          .select()
          .from(users)
          .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
          .where(eq(users.id, id))
          .for("update");
        if (!lockedRow) {
          return null;
        }
        const existing = memberFromJoinedRow(lockedRow);
        const now = new Date();
        const [userRow] = await transaction
          .update(users)
          .set({
            email: input.email
              ? input.email.trim().toLowerCase()
              : existing.email,
            displayName: input.displayName ?? existing.displayName,
            phone: input.phone === undefined ? existing.phone : input.phone,
            role: input.roles
              ? input.roles.join(",")
              : existing.roles.join(","),
            status: input.status ?? existing.status,
            updatedAt: now
          })
          .where(eq(users.id, id))
          .returning();
        if (!userRow) {
          return null;
        }

        const profile = mergedProfileValues(id, existing, input);
        const [profileRow] = await transaction
          .insert(memberProfiles)
          .values(profile)
          .onConflictDoUpdate({
            target: memberProfiles.userId,
            set: profile
          })
          .returning();
        if (!profileRow) {
          throw new Error("Failed to update member profile.");
        }
        return memberFromRows(userRow, profileRow);
      });
    } catch (error) {
      if (input.email && isPostgresMemberEmailConflict(error)) {
        throw new MemberEmailConflictRepositoryError(input.email);
      }
      throw error;
    }
  }
}

type UserRow = typeof users.$inferSelect;
type MemberProfileRow = typeof memberProfiles.$inferSelect;
type JoinedMemberRow = {
  users: UserRow;
  member_profiles: MemberProfileRow | null;
};

function memberFromJoinedRow(row: JoinedMemberRow): MemberProfile {
  return memberFromRows(row.users, row.member_profiles);
}

function memberFromRows(
  user: UserRow,
  profile: MemberProfileRow | null
): MemberProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    address: profile?.address ?? null,
    faithStartYear: profile?.faithStartYear ?? null,
    baptizedYear: profile?.baptizedYear ?? null,
    joinedChurchAt: dateToIsoDate(profile?.joinedChurchAt),
    emergencyContactName: profile?.emergencyContactName ?? null,
    emergencyContactPhone: profile?.emergencyContactPhone ?? null,
    status: user.status,
    roles: parseRoles(user.role),
    appLocale: parseLocale(profile?.appLocale),
    fellowshipGroupId: profile?.fellowshipGroupId ?? null,
    notificationSettings: normalizeNotifications(profile?.notificationSettings),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function parseRoles(value: string): MemberRole[] {
  const roles = value
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is MemberRole =>
      ["member", "leader", "pastor"].includes(role)
    );
  return roles.length > 0 ? roles : ["member"];
}

function parseLocale(value: string | null | undefined): SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale)
    ? (value as SupportedLocale)
    : "en";
}

function normalizeNotifications(
  settings: unknown
): MemberNotificationSettings {
  return memberNotificationSettingsSchema.parse(settings ?? {});
}

function profileValues(userId: string, input: MemberCreateRequest) {
  return {
    userId,
    address: input.address ?? null,
    faithStartYear: input.faithStartYear ?? null,
    baptizedYear: input.baptizedYear ?? null,
    joinedChurchAt: dateFromIso(input.joinedChurchAt),
    emergencyContactName: input.emergencyContactName ?? null,
    emergencyContactPhone: input.emergencyContactPhone ?? null,
    appLocale: input.appLocale ?? "en",
    fellowshipGroupId: input.fellowshipGroupId ?? null,
    notificationSettings: normalizeNotifications(input.notificationSettings)
  };
}

function mergedProfileValues(
  userId: string,
  existing: MemberProfile,
  input: MemberUpdateRequest
) {
  return {
    userId,
    address: input.address === undefined ? existing.address : input.address,
    faithStartYear:
      input.faithStartYear === undefined
        ? existing.faithStartYear
        : input.faithStartYear,
    baptizedYear:
      input.baptizedYear === undefined
        ? existing.baptizedYear
        : input.baptizedYear,
    joinedChurchAt:
      input.joinedChurchAt === undefined
        ? dateFromIso(existing.joinedChurchAt)
        : dateFromIso(input.joinedChurchAt),
    emergencyContactName:
      input.emergencyContactName === undefined
        ? existing.emergencyContactName
        : input.emergencyContactName,
    emergencyContactPhone:
      input.emergencyContactPhone === undefined
        ? existing.emergencyContactPhone
        : input.emergencyContactPhone,
    appLocale: input.appLocale ?? existing.appLocale,
    fellowshipGroupId:
      input.fellowshipGroupId === undefined
        ? existing.fellowshipGroupId
        : input.fellowshipGroupId,
    notificationSettings: input.notificationSettings
      ? normalizeNotifications(input.notificationSettings)
      : existing.notificationSettings
  };
}

function dateFromIso(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateToIsoDate(value: Date | null | undefined): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}
