import type {
  EventCheckInCode,
  EventRegistration,
  LifePost
} from "@mbc/api-contracts";

import {
  eventCheckInCodes,
  eventRegistrations,
  lifePostReads,
  publicPosts
} from "../../shared/db/schema.js";
import type { LifePostReadState } from "./life-post.repository.js";

type PublicPostRow = typeof publicPosts.$inferSelect;
type EventRegistrationRow = typeof eventRegistrations.$inferSelect;
type EventCheckInCodeRow = typeof eventCheckInCodes.$inferSelect;
type LifePostReadRow = typeof lifePostReads.$inferSelect;

export function postFromRow(row: PublicPostRow): LifePost {
  return {
    id: row.id,
    revision: row.revision,
    sourceLocale: row.sourceLocale as LifePost["sourceLocale"],
    type: row.type,
    title: row.title,
    body: row.body,
    meta: row.meta,
    iconName: row.iconName,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    visibility: row.visibility,
    imageUrl: row.imageUrl,
    displayWeight: row.displayWeight,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    registrationEnabled: row.registrationEnabled,
    registrationCapacity: row.registrationCapacity,
    registrationDeadline: row.registrationDeadline?.toISOString() ?? null,
    registrationAllowCancellation: row.registrationAllowCancellation,
    registrationMaxPartySize: row.registrationMaxPartySize,
    registrationSummary: {
      enabled: row.registrationEnabled,
      capacity: row.registrationCapacity,
      registeredCount: 0,
      remainingCount: row.registrationCapacity,
      deadline: row.registrationDeadline?.toISOString() ?? null,
      allowCancellation: row.registrationAllowCancellation,
      maxPartySize: row.registrationMaxPartySize,
      myRegistrationStatus: null,
      myPartySize: null,
      myNote: null,
      myCheckedInAt: null,
      myCheckInMethod: null
    },
    status: row.status,
    updatedAt: row.updatedAt.toISOString()
  };
}

export function registrationFromRow(
  row: EventRegistrationRow
): EventRegistration {
  return {
    id: row.id,
    lifePostId: row.lifePostId,
    userId: row.userId,
    attendeeName: row.attendeeName,
    attendeeEmail: row.attendeeEmail,
    partySize: row.partySize,
    status: row.status,
    note: row.note,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    checkInMethod: row.checkInMethod,
    checkedInByAdminUserId: row.checkedInByAdminUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function checkInCodeFromRow(row: EventCheckInCodeRow): EventCheckInCode {
  return {
    id: row.id,
    lifePostId: row.lifePostId,
    qrPayload: row.qrPayload,
    shortCode: row.shortCode,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    disabledAt: row.disabledAt?.toISOString() ?? null,
    createdByAdminUserId: row.createdByAdminUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function readStateFromRow(row: LifePostReadRow): LifePostReadState {
  return {
    lifePostId: row.lifePostId,
    userId: row.userId,
    readAt: row.readAt.toISOString()
  };
}

export function dateFromIso(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export function cleanNullableString(
  value: string | null | undefined
): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}
