import type {
  ReadingPlanDay,
  ReadingPlanStatus,
  ReadingPlanVisibility
} from "@mbc/api-contracts";

export function allowedReadingPlanStatuses(
  status?: ReadingPlanStatus
): ReadingPlanStatus[] {
  switch (status) {
    case "draft":
      return ["draft", "published", "archived"];
    case "published":
      return ["published", "paused", "archived"];
    case "paused":
      return ["paused", "draft", "published", "archived"];
    case "archived":
      return ["archived", "draft"];
    default:
      return ["draft"];
  }
}

export function readingPlanContentIsLocked(status?: ReadingPlanStatus) {
  return status === "published" || status === "archived";
}

export function readingPlanDayIsEditable(status?: ReadingPlanStatus) {
  return status === "draft" || status === "paused";
}

export function readingPlanVisibilityAllowsUserType(
  visibility: ReadingPlanVisibility | undefined,
  userType: "member" | "external"
) {
  return visibility !== "members" || userType === "member";
}

export function nextReadingPlanDayNumber(
  days: Pick<ReadingPlanDay, "dayNumber">[],
  durationDays: number
) {
  const existing = new Set(days.map((day) => day.dayNumber));
  for (let dayNumber = 1; dayNumber <= durationDays; dayNumber += 1) {
    if (!existing.has(dayNumber)) {
      return dayNumber;
    }
  }
  return Math.max(1, durationDays + 1);
}
