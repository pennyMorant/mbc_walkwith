const pushDeviceConstraints = new Set([
  "idx_member_device_tokens_push_token",
  "idx_member_device_tokens_installation",
  "idx_member_device_tokens_guest_installation"
]);

export function isPostgresPushDeviceConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { code?: unknown; constraint?: unknown };
  return (
    record.code === "23505" &&
    typeof record.constraint === "string" &&
    pushDeviceConstraints.has(record.constraint)
  );
}
