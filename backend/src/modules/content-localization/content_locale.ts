import type { ContentLocale } from "@mbc/api-contracts";

export function contentLocaleFromHeader(value: string | string[] | undefined): ContentLocale {
  const header = Array.isArray(value) ? value[0] : value;
  for (const entry of header?.split(",") ?? []) {
    const candidate = entry.trim().split(";")[0]?.replace("_", "-").toLowerCase();
    if (candidate === "zh-hant" || candidate?.startsWith("zh-tw") || candidate?.startsWith("zh-hk")) return "zh-Hant";
    if (candidate === "zh-hans" || candidate?.startsWith("zh-cn") || candidate?.startsWith("zh-sg") || candidate === "zh") return "zh-Hans";
    if (candidate?.startsWith("es")) return "es";
    if (candidate?.startsWith("en")) return "en";
  }
  return "en";
}
