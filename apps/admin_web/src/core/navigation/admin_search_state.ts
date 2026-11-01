export const ADMIN_SEARCH_MIN_LENGTH = 2;

export function normalizeAdminSearchText(value: string): string {
  return value.trim();
}

export function isCurrentAdminSearchSnapshot(
  input: string,
  appliedSnapshot: string
): boolean {
  const normalizedInput = normalizeAdminSearchText(input);
  return (
    appliedSnapshot.length >= ADMIN_SEARCH_MIN_LENGTH &&
    normalizedInput === appliedSnapshot
  );
}
