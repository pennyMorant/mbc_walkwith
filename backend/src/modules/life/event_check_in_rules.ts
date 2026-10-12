import type { LifePost } from "@mbc/api-contracts";
import { randomBytes } from "node:crypto";

import { checkInOutsideWindow } from "./event_registration_errors.js";

const eventCheckInQrPrefix = "mbcg:event-check-in:";
const memberCheckInEarlyWindowMs = 30 * 60 * 1000;
const memberCheckInGracePeriodMs = 12 * 60 * 60 * 1000;

export function generateEventCheckInQrPayload() {
  return `${eventCheckInQrPrefix}${randomBytes(24).toString("base64url")}`;
}

export function generateEventCheckInShortCode() {
  return `MBCG-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function normalizeEventCheckInCode(value: string) {
  return value.trim().toUpperCase();
}

export function defaultCheckInCodeExpiresAt(post: LifePost) {
  const now = new Date();
  const scheduledEnd = dateValue(post.endsAt) ?? dateValue(post.startsAt);
  if (scheduledEnd && scheduledEnd.getTime() > now.getTime()) {
    return new Date(
      scheduledEnd.getTime() + memberCheckInGracePeriodMs
    ).toISOString();
  }
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export function requireMemberCheckInWindow(
  post: LifePost,
  registrationId: string
) {
  const startsAt = dateValue(post.startsAt);
  if (!startsAt) {
    return;
  }
  const now = Date.now();
  if (now < startsAt.getTime() - memberCheckInEarlyWindowMs) {
    throw checkInOutsideWindow(post.id, registrationId, "before_window");
  }
  const endsAt = dateValue(post.endsAt) ?? startsAt;
  if (now > endsAt.getTime() + memberCheckInGracePeriodMs) {
    throw checkInOutsideWindow(post.id, registrationId, "after_window");
  }
}

function dateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}
