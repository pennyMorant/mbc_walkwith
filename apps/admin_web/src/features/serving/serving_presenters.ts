import type {
  ServingAssignment,
  ServingCheckInRecord,
  ServingMemberOption
} from "@mbc/api-contracts";

export function servingMemberLabel(member: ServingMemberOption): string {
  return member.displayName
    ? `${member.displayName} · ${member.email}`
    : member.email;
}

export function servingMemberLabelById(
  members: ServingMemberOption[],
  userId: string
): string {
  const member = members.find((item) => item.id === userId);
  return member ? servingMemberLabel(member) : userId;
}

export function servingAssignmentLabel(assignment: ServingAssignment): string {
  return `${assignment.title} · ${assignment.memberDisplayName}`;
}

export function formatServingDateTime(
  value: string | null,
  locale: string
): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function servingCheckInRequiresReason(
  current: ServingCheckInRecord | undefined,
  nextStatus: ServingCheckInRecord["status"]
): boolean {
  return Boolean(current && current.status !== nextStatus);
}
