import type { NewcomerProfile, NewcomerStatus } from "@mbc/api-contracts";

export const newcomerStatusOptions = [
  "new",
  "assigned",
  "contacted",
  "visited",
  "invited_to_group",
  "invited_to_course",
  "in_discipleship",
  "converted_to_member",
  "paused",
  "closed"
] as const;

export const newcomerFilterStatusOptions = [
  "",
  ...newcomerStatusOptions
] as const;

export const conversionStatusOptions = [
  "none",
  "linked_existing_member",
  "created_member",
  "declined"
] as const;

export const followUpStatusOptions = [
  "completed",
  "planned",
  "missed",
  "cancelled"
] as const;

export function newcomerStatusColor(status: NewcomerStatus) {
  if (status === "converted_to_member") return "success";
  if (status === "closed" || status === "paused") return "secondary";
  if (status === "new") return "warning";
  if (status === "in_discipleship") return "primary";
  return "info";
}

export function newcomerContactLine(
  newcomer: Pick<NewcomerProfile, "email" | "phone">
) {
  return [newcomer.email, newcomer.phone].filter(Boolean).join(" · ");
}

export function isoToDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export function dateTimeInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
