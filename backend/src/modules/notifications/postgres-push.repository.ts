import type {
  MemberNotificationSettings,
  MemberPushDevice
} from "@mbc/api-contracts";
import { and, eq, isNull } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  memberDeviceTokens,
  memberProfiles,
  users
} from "../../shared/db/schema.js";
import type {
  NotificationPreferenceKey,
  PushDeliveryTarget,
  PushTargetQuery,
  PushRepository,
  UpsertGuestPushDeviceInput,
  UpsertMemberPushDeviceInput
} from "./push.repository.js";
import { isPostgresPushDeviceConflict } from "./postgres_notification_errors.js";

export class PostgresPushRepository implements PushRepository {
  constructor(private readonly db: AppDb) {}

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
    input: UpsertGuestPushDeviceInput & { userId: string | null },
    canRetryConflict = true
  ): Promise<MemberPushDevice> {
    try {
      return await this.persistDevice(input);
    } catch (error) {
      if (canRetryConflict && isPostgresPushDeviceConflict(error)) {
        return this.upsertDevice(input, false);
      }
      throw error;
    }
  }

  private async persistDevice(
    input: UpsertGuestPushDeviceInput & { userId: string | null }
  ): Promise<MemberPushDevice> {
    const now = new Date();
    const byToken = await this.db
      .update(memberDeviceTokens)
      .set({
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
      })
      .where(eq(memberDeviceTokens.pushToken, input.pushToken))
      .returning();
    if (byToken[0]) {
      return pushDeviceFromRow(byToken[0]);
    }

    const installationFilters = [
      eq(memberDeviceTokens.installationId, input.installationId),
      input.userId === null
        ? isNull(memberDeviceTokens.userId)
        : eq(memberDeviceTokens.userId, input.userId)
    ];
    const byInstallation = await this.db
      .update(memberDeviceTokens)
      .set({
        userId: input.userId,
        platform: input.platform,
        provider: input.provider,
        pushToken: input.pushToken,
        permissionStatus: input.permissionStatus,
        locale: input.locale,
        appVersion: input.appVersion,
        lastSeenAt: now,
        updatedAt: now,
        revokedAt: null
      })
      .where(and(...installationFilters))
      .returning();
    if (byInstallation[0]) {
      return pushDeviceFromRow(byInstallation[0]);
    }

    const [created] = await this.db
      .insert(memberDeviceTokens)
      .values({
        userId: input.userId,
        installationId: input.installationId,
        platform: input.platform,
        provider: input.provider,
        pushToken: input.pushToken,
        permissionStatus: input.permissionStatus,
        locale: input.locale,
        appVersion: input.appVersion,
        lastSeenAt: now,
        updatedAt: now
      })
      .returning();
    if (!created) {
      throw new Error("Failed to register member push device.");
    }
    return pushDeviceFromRow(created);
  }

  async revokeMemberDevice(
    userId: string,
    installationId: string
  ): Promise<boolean> {
    const updated = await this.db
      .update(memberDeviceTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(memberDeviceTokens.userId, userId),
          eq(memberDeviceTokens.installationId, installationId),
          isNull(memberDeviceTokens.revokedAt)
        )
      )
      .returning({ id: memberDeviceTokens.id });
    return updated.length > 0;
  }

  async revokeGuestDevice(installationId: string): Promise<boolean> {
    const updated = await this.db
      .update(memberDeviceTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          isNull(memberDeviceTokens.userId),
          eq(memberDeviceTokens.installationId, installationId),
          isNull(memberDeviceTokens.revokedAt)
        )
      )
      .returning({ id: memberDeviceTokens.id });
    return updated.length > 0;
  }

  async revokeMemberDeviceByToken(pushToken: string): Promise<boolean> {
    const updated = await this.db
      .update(memberDeviceTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(memberDeviceTokens.pushToken, pushToken),
          isNull(memberDeviceTokens.revokedAt)
        )
      )
      .returning({ id: memberDeviceTokens.id });
    return updated.length > 0;
  }

  async listActiveTargets(query: PushTargetQuery): Promise<PushDeliveryTarget[]> {
    const rows = await this.db
      .select()
      .from(memberDeviceTokens)
      .leftJoin(users, eq(users.id, memberDeviceTokens.userId))
      .leftJoin(memberProfiles, eq(memberProfiles.userId, users.id))
      .where(isNull(memberDeviceTokens.revokedAt));

    return dedupeTargetsByPushToken(
      rows
        .filter((row) => row.member_device_tokens.permissionStatus !== "denied")
        .map((row) => {
          const token = row.member_device_tokens;
          if (token.userId === null) {
            if (query.audience !== "public") {
              return null;
            }
            return {
              device: pushDeviceFromRow(token),
              userId: null,
              audience: "guest"
            } satisfies PushDeliveryTarget;
          }
          if (
            query.audience === "member_specific" &&
            !query.userIds?.includes(token.userId)
          ) {
            return null;
          }
          if (!row.users || row.users.status !== "active") {
            return null;
          }
          if (
            query.preference &&
            !isPreferenceEnabled(
              row.member_profiles?.notificationSettings,
              query.preference
            )
          ) {
            return null;
          }
          return {
            device: pushDeviceFromRow(token),
            userId: token.userId,
            audience: "member"
          } satisfies PushDeliveryTarget;
        })
        .filter((target) => target !== null)
    );
  }
}

type MemberDeviceTokenRow = typeof memberDeviceTokens.$inferSelect;

function pushDeviceFromRow(row: MemberDeviceTokenRow): MemberPushDevice {
  return {
    id: row.id,
    installationId: row.installationId,
    platform: row.platform,
    provider: row.provider,
    pushToken: row.pushToken,
    permissionStatus: row.permissionStatus,
    locale: row.locale,
    appVersion: row.appVersion,
    lastSeenAt: row.lastSeenAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null
  };
}

function isPreferenceEnabled(
  settings: unknown,
  preference: NotificationPreferenceKey
) {
  if (settings == null || typeof settings !== "object") {
    return false;
  }
  return (
    (settings as Partial<MemberNotificationSettings>)[preference] === true
  );
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
