import type { ApiEnvelope } from "@mbc/api-contracts";

export function ok<T>(data: T, meta: ApiEnvelope<T>["meta"] = {}) {
  return { data, meta };
}

export function listMeta(limit: number, nextCursor: string | null = null) {
  return {
    pagination: {
      limit,
      nextCursor
    }
  };
}
