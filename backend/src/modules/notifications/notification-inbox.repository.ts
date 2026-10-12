import type {
  MemberNotificationSettings,
  NotificationAudience
} from "@mbc/api-contracts";

export type NotificationData = Record<string, string>;

export type NotificationMessage = {
  id: string;
  type: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  route: string | null;
  data: NotificationData;
  sourceType: string | null;
  sourceId: string | null;
  dedupeKey: string;
  createdByAdminUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberNotificationItem = {
  id: string;
  messageId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  route: string | null;
  data: NotificationData;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type CreateNotificationMessageInput = {
  type: string;
  title: string;
  body: string;
  audience?: NotificationAudience;
  route?: string | null;
  data?: NotificationData;
  sourceType?: string | null;
  sourceId?: string | null;
  dedupeKey: string;
  createdByAdminUserId?: string | null;
};

export type CreateMemberNotificationItemsInput = {
  message: NotificationMessage;
  userIds: string[];
};

export type MemberNotificationListQuery = {
  limit: number;
  includeArchived?: boolean;
};

export type EligibleNotificationMember = {
  userId: string;
  appLocale: string;
};

export interface NotificationInboxRepository {
  createOrGetMessage(
    input: CreateNotificationMessageInput
  ): Promise<{ message: NotificationMessage; created: boolean }>;
  listEligibleMemberIds(
    preference: keyof MemberNotificationSettings,
    query?: { userIds?: string[] }
  ): Promise<string[]>;
  listEligibleMembers(
    preference: keyof MemberNotificationSettings,
    query?: { userIds?: string[] }
  ): Promise<EligibleNotificationMember[]>;
  createMemberItems(
    input: CreateMemberNotificationItemsInput
  ): Promise<MemberNotificationItem[]>;
  listMemberItems(
    userId: string,
    query: MemberNotificationListQuery
  ): Promise<MemberNotificationItem[]>;
  countUnreadMemberItems(userId: string): Promise<number>;
  markMemberItemRead(
    userId: string,
    itemId: string
  ): Promise<MemberNotificationItem | null>;
  markAllMemberItemsRead(userId: string): Promise<number>;
  archiveAllMemberItems(userId: string): Promise<number>;
  archiveMemberItem(
    userId: string,
    itemId: string
  ): Promise<MemberNotificationItem | null>;
}
