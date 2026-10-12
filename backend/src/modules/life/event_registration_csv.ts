import type { EventRegistration } from "@mbc/api-contracts";

export function eventRegistrationsToCsv(registrations: EventRegistration[]) {
  return [
    [
      "registrationId",
      "status",
      "attendeeName",
      "attendeeEmail",
      "partySize",
      "note",
      "checkedInAt",
      "checkInMethod",
      "checkedInByAdminUserId",
      "createdAt"
    ].join(","),
    ...registrations.map((registration) =>
      [
        registration.id,
        registration.status,
        registration.attendeeName,
        registration.attendeeEmail ?? "",
        registration.partySize,
        registration.note,
        registration.checkedInAt ?? "",
        registration.checkInMethod ?? "",
        registration.checkedInByAdminUserId ?? "",
        registration.createdAt
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\n");
}

function csvCell(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}
