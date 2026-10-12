import { memberNotificationSettingsSchema } from "@mbc/api-contracts";
import type { MemberNotificationSettings } from "@mbc/api-contracts";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  sql
} from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  memberNotificationItems,
  memberProfiles,
  notificationMessages,
  users
} from "../../shared/db/schema.js";
import type {
  CreateMemberNotificationItemsInput,
  CreateNotificationMessageInput,
  EligibleNotificationMember,
  MemberNotificationItem,
  MemberNotificationListQuery,
  NotificationData,
  NotificationInboxRepository,
  NotificationMessage
} from "./notification-inbox.repository.js";

export class PostgresNotificationInboxRepository
  implements NotificationInboxRepository
{
  constructor(private readonly db: AppDb) {}

  async createOrGetMessage(input: CreateNotificationMessageInput) {
    const [created] = await this.db
      .insert(notificationMessages)
      .values({
        type: input.type,
        title: input.title,
        body: input.body,
        audience: input.audience ?? "members",
        route: input.route ?? null,
        data: input.data ?? {},
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        dedupeKey: input.dedupeKey,
        createdByAdminUserId: input.createdByAdminUserId ?? null
      })
      .onConflictDoNothing({
        target: notificationMessages.dedupeKey
      })
      .returning();
    if (created) {
      return { message: messageFromRow(created), created: true };
    }

    const [existing] = await this.db
      .select()
      .from(notificationMessages)
      .where(eq(notificationMessages.dedupeKey, input.dedupeKey))
      .limit(1);
    if (!existing) {
      throw new Error("Failed to create or load notification message.");
    }
    return { message: messageFromRow(existing), created: false };
  }

  async listEligibleMemberIds(
    preference: keyof MemberNotificationSettings,
    query: { userIds?: string[] } = {}
  ): Promise<string[]> {
    if (query.userIds?.length === 0) {
      return [];
    }
    const filters = [
      eq(users.status, "active"),
      query.userIds?.length ? inArray(users.id, query.userIds) : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select({
        userId: users.id,
        notificationSettings: memberProfiles.notificationSettings
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(and(...filters));
    return rows
      .filter((row) =>
        memberNotificationSettingsSchema.parse(
          row.notificationSettings ?? {}
        )[preference]
      )
      .map((row) => row.userId);
  }

  async listEligibleMembers(
    preference: keyof MemberNotificationSettings,
    query: { userIds?: string[] } = {}
  ): Promise<EligibleNotificationMember[]> {
    if (query.userIds?.length === 0) {
      return [];
    }
    const filters = [
      eq(users.status, "active"),
      query.userIds?.length ? inArray(users.id, query.userIds) : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select({
        userId: users.id,
        appLocale: memberProfiles.appLocale,
        notificationSettings: memberProfiles.notificationSettings
      })
      .from(users)
      .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(and(...filters));
    return rows
      .filter((row) =>
        memberNotificationSettingsSchema.parse(
          row.notificationSettings ?? {}
        )[preference]
      )
      .map((row) => ({ userId: row.userId, appLocale: row.appLocale }));
  }

  async createMemberItems(input: CreateMemberNotificationItemsInput) {
    const userIds = [...new Set(input.userIds)];
    if (userIds.length === 0) {
      return [];
    }
    await this.db
      .insert(memberNotificationItems)
      .values(
        userIds.map((userId) => ({
          messageId: input.message.id,
          userId,
          type: input.message.type,
          title: input.message.title,
          body: input.message.body,
          route: input.message.route,
          data: input.message.data
        }))
      )
      .onConflictDoNothing({
        target: [
          memberNotificationItems.messageId,
          memberNotificationItems.userId
        ]
      });

    const rows = await this.db
      .select()
      .from(memberNotificationItems)
      .where(
        and(
          eq(memberNotificationItems.messageId, input.message.id),
          inArray(memberNotificationItems.userId, userIds)
        )
      )
      .orderBy(memberNotificationItems.createdAt);
    return rows.map(itemFromRow);
  }

  async listMemberItems(userId: string, query: MemberNotificationListQuery) {
    const filters = [
      eq(memberNotificationItems.userId, userId),
      query.includeArchived ? undefined : isNull(memberNotificationItems.archivedAt)
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(memberNotificationItems)
      .where(and(...filters))
      .orderBy(desc(memberNotificationItems.createdAt))
      .limit(query.limit);
    return rows.map(itemFromRow);
  }

  async countUnreadMemberItems(userId: string) {
    const [row] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(memberNotificationItems)
      .where(
        and(
          eq(memberNotificationItems.userId, userId),
          isNull(memberNotificationItems.readAt),
          isNull(memberNotificationItems.archivedAt)
        )
      );
    return Number(row?.total ?? 0);
  }

  async markMemberItemRead(userId: string, itemId: string) {
    const [updated] = await this.db
      .update(memberNotificationItems)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(memberNotificationItems.id, itemId),
          eq(memberNotificationItems.userId, userId)
        )
      )
      .returning();
    return updated ? itemFromRow(updated) : null;
  }

  async markAllMemberItemsRead(userId: string) {
    const updated = await this.db
      .update(memberNotificationItems)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(memberNotificationItems.userId, userId),
          isNull(memberNotificationItems.readAt),
          isNull(memberNotificationItems.archivedAt)
        )
      )
      .returning({ id: memberNotificationItems.id });
    return updated.length;
  }

  async archiveAllMemberItems(userId: string) {
    const updated = await this.db
      .update(memberNotificationItems)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(memberNotificationItems.userId, userId),
          isNull(memberNotificationItems.archivedAt)
        )
      )
      .returning({ id: memberNotificationItems.id });
    return updated.length;
  }

  async archiveMemberItem(userId: string, itemId: string) {
    const [updated] = await this.db
      .update(memberNotificationItems)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(memberNotificationItems.id, itemId),
          eq(memberNotificationItems.userId, userId)
        )
      )
      .returning();
    return updated ? itemFromRow(updated) : null;
  }
}

type NotificationMessageRow = typeof notificationMessages.$inferSelect;
type MemberNotificationItemRow = typeof memberNotificationItems.$inferSelect;

function messageFromRow(row: NotificationMessageRow): NotificationMessage {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    audience: row.audience,
    route: row.route,
    data: dataFromUnknown(row.data),
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    dedupeKey: row.dedupeKey,
    createdByAdminUserId: row.createdByAdminUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function itemFromRow(row: MemberNotificationItemRow): MemberNotificationItem {
  return {
    id: row.id,
    messageId: row.messageId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    route: row.route,
    data: dataFromUnknown(row.data),
    readAt: row.readAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

function dataFromUnknown(value: unknown): NotificationData {
  if (value == null || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      entry?.toString() ?? ""
    ])
  );
}
