import type {
  CareFollowUpStatus,
  CareRequestStatus
} from "@mbc/api-contracts";

export function shouldAdvanceCareRequestForFollowUp(
  followUpStatus: CareFollowUpStatus,
  currentStatus: CareRequestStatus
) {
  return (
    followUpStatus === "completed" &&
    currentStatus !== "resolved" &&
    currentStatus !== "archived"
  );
}
