const memberEmailConstraints = new Set([
  "users_email_key",
  "users_email_unique"
]);

export function isPostgresMemberEmailConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { code?: unknown; constraint?: unknown };
  return (
    record.code === "23505" &&
    typeof record.constraint === "string" &&
    memberEmailConstraints.has(record.constraint)
  );
}
