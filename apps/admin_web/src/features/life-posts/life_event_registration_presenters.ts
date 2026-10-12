import type { EventRegistrationStatus } from "@mbc/api-contracts";

export const eventRegistrationPageSize = 25;

export function eventRegistrationPageCount(total: number) {
  return Math.max(1, Math.ceil(total / eventRegistrationPageSize));
}

export function eventRegistrationCountLabel(
  total: number,
  t: (key: string) => string
) {
  return `${total} ${t(total === 1 ? "Registration" : "Registrations")}`;
}

export function eventRegistrationStatusColor(
  status: EventRegistrationStatus
) {
  const colors: Record<EventRegistrationStatus, string> = {
    confirmed: "primary",
    checked_in: "success",
    cancelled: "secondary",
    absent: "warning"
  };
  return colors[status];
}
