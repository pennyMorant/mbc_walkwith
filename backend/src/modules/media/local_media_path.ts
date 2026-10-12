import { isAbsolute, join, resolve, sep } from "node:path";

import type { AppConfig } from "../../config/env.js";

export function localMediaUploadDir(config: AppConfig, scope: string) {
  const root = config.mediaUploadDir ?? "uploads";
  const uploadRoot = isAbsolute(root) ? root : join(process.cwd(), root);
  return resolve(uploadRoot, scope);
}

export function resolveLocalStoredPath(
  storagePath: string | null | undefined,
  uploadDir: string
) {
  if (!storagePath?.startsWith("local:")) {
    return null;
  }
  const filePath = resolve(storagePath.slice("local:".length));
  const root = resolve(uploadDir);
  return filePath.startsWith(`${root}${sep}`) ? filePath : null;
}
