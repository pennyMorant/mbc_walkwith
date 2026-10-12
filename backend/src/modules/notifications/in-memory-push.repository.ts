import type {
  MemberNotificationSettings,
  MemberPushDevice
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { MemberRepository } from "../members/member.repository.js";
import type {
  NotificationPreferenceKey,
  PushDeliveryTarget,
  PushTargetQuery,
  PushRepository,
  UpsertGuestPushDeviceInput,
  UpsertMemberPushDeviceInput
} from "./push.repository.js";

type DeviceRecord = MemberPushDevice & {
  userId: string | null;
};

export class InMemoryPushRepository implements PushRepository {
  private devices = new Map<string, DeviceRecord>();

  constructor(private readonly memberRepository: MemberRepository) {}

  async upsertMemberDevice(
    input: UpsertMemberPushDeviceInput
  ): Promise<MemberPushDevice> {
    return this.upsertDevice({ ...input, userId: input.userId });
  }

  async upsertGuestDevice(
    input: UpsertGuestPushDeviceInput
  ): Promise<MemberPushDevice> {
    return this.upsertDevice({ ...input, userId: null });
  }

  private async upsertDevice(
    input: UpsertGuestPushDeviceInput & { userId: string | null }
  ): Promise<MemberPushDevice> {
    const now = new Date().toISOString();
    const existing =
      [...this.devices.values()].find(
        (device) =>
          device.userId === input.userId &&
          device.installationId === input.installationId
      ) ??
      [...this.devices.values()].find(
        (device) => device.pushToken === input.pushToken
      );

    const next: DeviceRecord = existing
      ? {
          ...existing,
          userId: input.userId,
          installationId: input.installationId,
          platform: input.platform,
          provider: input.provider,
          pushToken: input.pushToken,
          permissionStatus: input.permissionStatus,
          locale: input.locale,
          appVersion: input.appVersion,
          lastSeenAt: now,
          updatedAt: now,
          revokedAt: null
        }
      : {
          id: randomUUID(),
          userId: input.userId,
          installationId: input.installationId,
          platform: input.platform,
          provider: input.provider,
          pushToken: input.pushToken,
          permissionStatus: input.permissionStatus,
          locale: input.locale,
          appVersion: input.appVersion,
          lastSeenAt: now,
          updatedAt: now,
          revokedAt: null
        };

    this.devices.set(next.id, next);
    return toMemberPushDevice(next);
  }

  async revokeMemberDevice(
    userId: string,
    installationId: string
  ): Promise<boolean> {
    const device = [...this.devices.values()].find(
      (entry) =>
        entry.userId === userId && entry.installationId === installationId
    );
    if (!device) {
      return false;
    }
    const now = new Date().toISOString();
    this.devices.set(device.id, {
      ...device,
      revokedAt: now,
      updatedAt: now
    });
    return true;
  }

  async revokeGuestDevice(installationId: string): Promise<boolean> {
    const device = [...this.devices.values()].find(
      (entry) => entry.userId === null && entry.installationId === installationId
    );
    if (!device) {
      return false;
    }
    const now = new Date().toISOString();
    this.devices.set(device.id, {
      ...device,
      revokedAt: now,
      updatedAt: now
    });
    return true;
  }

  async revokeMemberDeviceByToken(pushToken: string): Promise<boolean> {
    const device = [...this.devices.values()].find(
      (entry) => entry.pushToken === pushToken
    );
    if (!device) {
      return false;
    }
    const now = new Date().toISOString();
    this.devices.set(device.id, {
      ...device,
      revokedAt: now,
      updatedAt: now
    });
    return true;
  }

  async listActiveTargets(query: PushTargetQuery): Promise<PushDeliveryTarget[]> {
    const active = [...this.devices.values()].filter(
      (device) =>
        device.revokedAt == null && device.permissionStatus !== "denied"
    );
    const targets = await Promise.all(
      active.map(async (device) => {
        if (device.userId === null) {
          if (query.audience !== "public") {
            return null;
          }
          return {
            device: toMemberPushDevice(device),
            userId: null,
            audience: "guest"
          } satisfies PushDeliveryTarget;
        }
        if (
          query.audience === "member_specific" &&
          !query.userIds?.includes(device.userId)
        ) {
          return null;
        }
        const member = await this.memberRepository.getById(device.userId);
        if (!member || member.status !== "active") {
          return null;
        }
        if (
          query.preference &&
          !isPreferenceEnabled(member.notificationSettings, query.preference)
        ) {
          return null;
        }
        return {
          device: toMemberPushDevice(device),
          userId: device.userId,
          audience: "member"
        } satisfies PushDeliveryTarget;
      })
    );
    return dedupeTargetsByPushToken(targets.filter((target) => target !== null));
  }
}

function toMemberPushDevice(device: DeviceRecord): MemberPushDevice {
  return {
    id: device.id,
    installationId: device.installationId,
    platform: device.platform,
    provider: device.provider,
    pushToken: device.pushToken,
    permissionStatus: device.permissionStatus,
    locale: device.locale,
    appVersion: device.appVersion,
    lastSeenAt: device.lastSeenAt,
    updatedAt: device.updatedAt,
    revokedAt: device.revokedAt
  };
}

function isPreferenceEnabled(
  settings: MemberNotificationSettings,
  preference: NotificationPreferenceKey
) {
  return settings[preference] === true;
}

function dedupeTargetsByPushToken(targets: PushDeliveryTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    if (seen.has(target.device.pushToken)) {
      return false;
    }
    seen.add(target.device.pushToken);
    return true;
  });
}
