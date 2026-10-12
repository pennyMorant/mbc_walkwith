import type {
  MemberCreateRequest,
  MemberListItem,
  MemberListQuery,
  MemberNotificationSettings,
  MemberProfile,
  MemberUpdateRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import {
  MemberEmailConflictRepositoryError,
  type MemberRepository
} from "./member.repository.js";

export class InMemoryMemberRepository implements MemberRepository {
  private members = new Map<string, MemberProfile>(
    seedMembers.map((member) => [member.id, member])
  );

  async list(query: MemberListQuery): Promise<MemberListItem[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.members.values()]
      .filter((member) => {
        if (query.status && member.status !== query.status) {
          return false;
        }
        if (
          query.fellowshipGroupId &&
          member.fellowshipGroupId !== query.fellowshipGroupId
        ) {
          return false;
        }
        if (normalizedQuery) {
          return [member.email, member.displayName, member.phone ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit)
      .map(memberListItemFromProfile);
  }

  async getById(id: string): Promise<MemberProfile | null> {
    return this.members.get(id) ?? null;
  }

  async listNotificationEligibleIds(
    preference: keyof MemberNotificationSettings,
    userIds?: string[]
  ): Promise<string[]> {
    const allowedUserIds = userIds ? new Set(userIds) : null;
    return [...this.members.values()]
      .filter(
        (member) =>
          member.status === "active" &&
          member.notificationSettings[preference] &&
          (!allowedUserIds || allowedUserIds.has(member.id))
      )
      .map((member) => member.id);
  }

  async getByEmail(email: string): Promise<MemberProfile | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return (
      [...this.members.values()].find(
        (member) => member.email.toLowerCase() === normalizedEmail
      ) ?? null
    );
  }

  async create(input: MemberCreateRequest): Promise<MemberProfile> {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (
      [...this.members.values()].some(
        (member) => member.email.toLowerCase() === normalizedEmail
      )
    ) {
      throw new MemberEmailConflictRepositoryError(input.email);
    }
    const now = new Date().toISOString();
    const member: MemberProfile = {
      id: randomUUID(),
      email: normalizedEmail,
      displayName: input.displayName,
      phone: input.phone ?? null,
      address: input.address ?? null,
      faithStartYear: input.faithStartYear ?? null,
      baptizedYear: input.baptizedYear ?? null,
      joinedChurchAt: input.joinedChurchAt ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      status: input.status ?? "active",
      roles: input.roles ?? ["member"],
      appLocale: input.appLocale ?? "en",
      fellowshipGroupId: input.fellowshipGroupId ?? null,
      notificationSettings: normalizeNotifications(input.notificationSettings),
      createdAt: now,
      updatedAt: now
    };
    this.members.set(member.id, member);
    return member;
  }

  async update(
    id: string,
    input: MemberUpdateRequest
  ): Promise<MemberProfile | null> {
    const existing = this.members.get(id);
    if (!existing) {
      return null;
    }
    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const conflict = [...this.members.values()].some(
        (member) =>
          member.id !== id && member.email.toLowerCase() === normalizedEmail
      );
      if (conflict) {
        throw new MemberEmailConflictRepositoryError(input.email);
      }
    }

    const updated: MemberProfile = {
      ...existing,
      email: input.email ? input.email.trim().toLowerCase() : existing.email,
      displayName: input.displayName ?? existing.displayName,
      phone: input.phone === undefined ? existing.phone : input.phone,
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
          ? existing.joinedChurchAt
          : input.joinedChurchAt,
      emergencyContactName:
        input.emergencyContactName === undefined
          ? existing.emergencyContactName
          : input.emergencyContactName,
      emergencyContactPhone:
        input.emergencyContactPhone === undefined
          ? existing.emergencyContactPhone
          : input.emergencyContactPhone,
      status: input.status ?? existing.status,
      roles: input.roles ?? existing.roles,
      appLocale: input.appLocale ?? existing.appLocale,
      fellowshipGroupId:
        input.fellowshipGroupId === undefined
          ? existing.fellowshipGroupId
          : input.fellowshipGroupId,
      notificationSettings: input.notificationSettings
        ? normalizeNotifications(input.notificationSettings)
        : existing.notificationSettings,
      updatedAt: new Date().toISOString()
    };
    this.members.set(id, updated);
    return updated;
  }
}

function memberListItemFromProfile(member: MemberProfile): MemberListItem {
  return {
    id: member.id,
    email: member.email,
    displayName: member.displayName,
    status: member.status,
    roles: member.roles,
    appLocale: member.appLocale,
    fellowshipGroupId: member.fellowshipGroupId,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  };
}

function normalizeNotifications(
  settings: Partial<MemberNotificationSettings> | undefined
): MemberNotificationSettings {
  return {
    weeklyBulletin: settings?.weeklyBulletin ?? true,
    sermonPublished: settings?.sermonPublished ?? true,
    lifePostPublished: settings?.lifePostPublished ?? true,
    prayerUpdates: settings?.prayerUpdates ?? false
  };
}

const seedMembers: MemberProfile[] = [
  {
    id: "member-lee",
    email: "grace@example.com",
    displayName: "Grace Lee",
    phone: null,
    address: null,
    faithStartYear: null,
    baptizedYear: null,
    joinedChurchAt: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    status: "active",
    roles: ["member"],
    appLocale: "en",
    fellowshipGroupId: "friday-fellowship",
    notificationSettings: normalizeNotifications({ prayerUpdates: true }),
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    id: "member-chan",
    email: "daniel@example.com",
    displayName: "Daniel Chan",
    phone: "+1 555 0100",
    address: null,
    faithStartYear: 2012,
    baptizedYear: 2014,
    joinedChurchAt: "2020-01-05",
    emergencyContactName: null,
    emergencyContactPhone: null,
    status: "active",
    roles: ["leader"],
    appLocale: "zh-Hans",
    fellowshipGroupId: "friday-fellowship",
    notificationSettings: normalizeNotifications(undefined),
    createdAt: "2026-05-02T18:00:00.000Z",
    updatedAt: "2026-05-02T18:00:00.000Z"
  }
];
