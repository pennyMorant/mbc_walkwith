export function isGivingFundCodeConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { code?: unknown; constraint?: unknown };
  return (
    record.code === "23505" &&
    (record.constraint === "giving_funds_code_unique" ||
      record.constraint === "giving_funds_code_key")
  );
}
