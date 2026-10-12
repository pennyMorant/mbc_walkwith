import {
  aiProviderResponseInvalid,
  aiProviderNetworkFailed,
  aiProviderTimeout
} from "./ai-errors.js";

export async function fetchAiProvider(
  provider: string,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw aiProviderTimeout(provider, timeoutMs);
    }
    throw aiProviderNetworkFailed(provider);
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseAiProviderJson<T>(
  provider: string,
  response: Response
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw aiProviderResponseInvalid(provider);
  }
}

function isAbortError(error: unknown): boolean {
  return errorName(error) === "AbortError";
}

function errorName(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return null;
  }
  const name = (error as { name?: unknown }).name;
  return typeof name === "string" ? name : null;
}
