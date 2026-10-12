function normalizeBasePath(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

export const appConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3020/v1",
  adminBasePath: normalizeBasePath(import.meta.env.VITE_ADMIN_BASE_PATH)
};
