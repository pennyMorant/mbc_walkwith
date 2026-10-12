import type { MemberNotificationSettings } from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { MemberRepository } from "../members/member.repository.js";
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

export class InMemoryNotificationInboxRepository
  implements NotificationInboxRepository
{
  private messages = new Map<string, NotificationMessage>();
  private items = new Map<string, MemberNotificationItem>();

  constructor(private readonly memberRepository: MemberRepository) {}

  async createOrGetMessage(input: CreateNotificationMessageInput) {
    const existing = [...this.messages.values()].find(
      (message) => message.dedupeKey === input.dedupeKey
    );
    if (existing) {
      return { message: existing, created: false };
    }

    const now = new Date().toISOString();
    const message: NotificationMessage = {
      id: randomUUID(),
      type: input.type,
      title: input.title,
      body: input.body,
      audience: input.audience ?? "members",
      route: input.route ?? null,
      data: input.data ?? {},
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      dedupeKey: input.dedupeKey,
      createdByAdminUserId: input.createdByAdminUserId ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.messages.set(message.id, message);
    return { message, created: true };
  }

  async listEligibleMemberIds(
    preference: keyof MemberNotificationSettings,
    query: { userIds?: string[] } = {}
  ): Promise<string[]> {
    return this.memberRepository.listNotificationEligibleIds(
      preference,
      query.userIds
    );
  }

  async listEligibleMembers(
    preference: keyof MemberNotificationSettings,
    query: { userIds?: string[] } = {}
  ): Promise<EligibleNotificationMember[]> {
    const userIds = await this.listEligibleMemberIds(preference, query);
    const members = await Promise.all(
      userIds.map((userId) => this.memberRepository.getById(userId))
    );
    return members.flatMap((member) =>
      member ? [{ userId: member.id, appLocale: member.appLocale }] : []
    );
  }

  async createMemberItems(input: CreateMemberNotificationItemsInput) {
    for (const userId of new Set(input.userIds)) {
      const existing = [...this.items.values()].find(
        (item) =>
          item.messageId === input.message.id && item.userId === userId
      );
      if (existing) {
        continue;
      }
      const item: MemberNotificationItem = {
        id: randomUUID(),
        messageId: input.message.id,
        userId,
        type: input.message.type,
        title: input.message.title,
        body: input.message.body,
        route: input.message.route,
        data: input.message.data,
        readAt: null,
        archivedAt: null,
        createdAt: new Date().toISOString()
      };
      this.items.set(item.id, item);
    }
    return this.itemsForMessage(input.message.id);
  }

  async listMemberItems(userId: string, query: MemberNotificationListQuery) {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.userId === userId &&
          (query.includeArchived || item.archivedAt === null)
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, query.limit);
  }

  async countUnreadMemberItems(userId: string) {
    return [...this.items.values()].filter(
      (item) =>
        item.userId === userId &&
        item.readAt === null &&
        item.archivedAt === null
    ).length;
  }

  async markMemberItemRead(userId: string, itemId: string) {
    const item = this.items.get(itemId);
    if (!item || item.userId !== userId) {
      return null;
    }
    if (item.readAt !== null) {
      return item;
    }
    const next = {
      ...item,
      readAt: new Date().toISOString()
    };
    this.items.set(itemId, next);
    return next;
  }

  async markAllMemberItemsRead(userId: string) {
    let updated = 0;
    const now = new Date().toISOString();
    for (const item of this.items.values()) {
      if (
        item.userId === userId &&
        item.readAt === null &&
        item.archivedAt === null
      ) {
        this.items.set(item.id, { ...item, readAt: now });
        updated += 1;
      }
    }
    return updated;
  }

  async archiveAllMemberItems(userId: string) {
    let updated = 0;
    const now = new Date().toISOString();
    for (const item of this.items.values()) {
      if (item.userId === userId && item.archivedAt === null) {
        this.items.set(item.id, { ...item, archivedAt: now });
        updated += 1;
      }
    }
    return updated;
  }

  async archiveMemberItem(userId: string, itemId: string) {
    const item = this.items.get(itemId);
    if (!item || item.userId !== userId) {
      return null;
    }
    if (item.archivedAt !== null) {
      return item;
    }
    const next = {
      ...item,
      archivedAt: new Date().toISOString()
    };
    this.items.set(itemId, next);
    return next;
  }

  private itemsForMessage(messageId: string) {
    return [...this.items.values()]
      .filter((item) => item.messageId === messageId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}

export function notificationData(value: unknown): NotificationData {
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
