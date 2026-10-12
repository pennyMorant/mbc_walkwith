import type {
  MemberNotificationSettings,
  MemberPushDevice,
  NotificationAudience,
  PushDevicePlatform,
  PushPermissionStatus,
  PushDeviceProvider
} from "@mbc/api-contracts";

export type NotificationPreferenceKey = keyof MemberNotificationSettings;

export type UpsertMemberPushDeviceInput = {
  userId: string;
  installationId: string;
  platform: PushDevicePlatform;
  provider: PushDeviceProvider;
  pushToken: string;
  permissionStatus: PushPermissionStatus;
  locale: string;
  appVersion: string | null;
};

export type UpsertGuestPushDeviceInput = Omit<
  UpsertMemberPushDeviceInput,
  "userId"
>;

export type PushDeliveryTarget = {
  device: MemberPushDevice;
  userId: string | null;
  audience: "member" | "guest";
};

export type PushTargetQuery = {
  audience: NotificationAudience;
  preference?: NotificationPreferenceKey | null;
  userIds?: string[];
};

export interface PushRepository {
  upsertMemberDevice(input: UpsertMemberPushDeviceInput): Promise<MemberPushDevice>;
  upsertGuestDevice(input: UpsertGuestPushDeviceInput): Promise<MemberPushDevice>;
  revokeMemberDevice(userId: string, installationId: string): Promise<boolean>;
  revokeGuestDevice(installationId: string): Promise<boolean>;
  revokeMemberDeviceByToken(pushToken: string): Promise<boolean>;
  listActiveTargets(query: PushTargetQuery): Promise<PushDeliveryTarget[]>;
}
