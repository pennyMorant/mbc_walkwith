import type {
  ApiEnvelope,
  PublicLandingResponse,
  SupportedLocale
} from "@mbc/api-contracts";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3020/v1";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export function getPublicLanding(locale: SupportedLocale) {
  const query = new URLSearchParams({ locale });
  return getJson<PublicLandingResponse>(`/public/landing?${query}`);
}
