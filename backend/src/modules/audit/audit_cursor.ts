import type { AuditLog } from "@mbc/api-contracts";

const separator = "~";
const cursorPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z~[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuditCursor = {
  createdAt: string;
  id: string;
};

export function encodeAuditCursor(
  log: Pick<AuditLog, "createdAt" | "id">
) {
  return `${log.createdAt}${separator}${log.id}`;
}

export function decodeAuditCursor(value: string): AuditCursor {
  if (!cursorPattern.test(value)) {
    throw new Error("Audit cursor is invalid.");
  }
  const separatorIndex = value.lastIndexOf(separator);
  const createdAt = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);
  return { createdAt: new Date(createdAt).toISOString(), id };
}

export function isAuditLogAfterCursor(
  log: Pick<AuditLog, "createdAt" | "id">,
  cursor: AuditCursor
) {
  return (
    log.createdAt < cursor.createdAt ||
    (log.createdAt === cursor.createdAt && log.id < cursor.id)
  );
}
