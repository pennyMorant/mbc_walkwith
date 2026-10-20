export function createAdminQueryCacheGuard(
  initialAccessToken: string | null,
  clear: () => void
) {
  let activeAccessToken = initialAccessToken;

  return (nextAccessToken: string | null) => {
    if (nextAccessToken === activeAccessToken) return;
    activeAccessToken = nextAccessToken;
    clear();
  };
}
