import type { MemberNotificationSettings } from "@mbc/api-contracts";

import type {
  CreateNotificationMessageInput,
  MemberNotificationItem,
  NotificationInboxRepository,
  NotificationMessage
} from "./notification-inbox.repository.js";

export type NotificationInboxFanoutResult = {
  message: NotificationMessage;
  items: MemberNotificationItem[];
  createdMessage: boolean;
};

export class NotificationInboxService {
  constructor(private readonly repository: NotificationInboxRepository) {}

  async createForPreference(
    input: CreateNotificationMessageInput & {
      preference: keyof MemberNotificationSettings;
      userIds?: string[];
    }
  ): Promise<NotificationInboxFanoutResult> {
    const { preference, userIds, ...messageInput } = input;
    const { message, created } =
      await this.repository.createOrGetMessage(messageInput);
    const eligibleUserIds = await this.repository.listEligibleMemberIds(
      preference,
      userIds ? { userIds } : {}
    );
    const items = await this.repository.createMemberItems({
      message,
      userIds: eligibleUserIds
    });
    return {
      message,
      items,
      createdMessage: created
    };
  }

  listEligibleMemberIds(
    preference: keyof MemberNotificationSettings,
    userIds?: string[]
  ) {
    return this.repository.listEligibleMemberIds(
      preference,
      userIds ? { userIds } : {}
    );
  }

  listEligibleMembers(
    preference: keyof MemberNotificationSettings,
    userIds?: string[]
  ) {
    return this.repository.listEligibleMembers(
      preference,
      userIds ? { userIds } : {}
    );
  }

  async listForMember(userId: string, limit = 50) {
    const [items, unreadCount] = await Promise.all([
      this.repository.listMemberItems(userId, { limit }),
      this.repository.countUnreadMemberItems(userId)
    ]);
    return { items, unreadCount };
  }

  markRead(userId: string, itemId: string) {
    return this.repository.markMemberItemRead(userId, itemId);
  }

  markAllRead(userId: string) {
    return this.repository.markAllMemberItemsRead(userId);
  }

  archiveAll(userId: string) {
    return this.repository.archiveAllMemberItems(userId);
  }

  archive(userId: string, itemId: string) {
    return this.repository.archiveMemberItem(userId, itemId);
  }
}
