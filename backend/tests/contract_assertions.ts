import { expect } from "vitest";
import type { ZodType } from "zod";

type JsonResponse = {
  json(): unknown;
};

export function expectResponseData<T>(
  response: JsonResponse,
  schema: ZodType<T>,
  label = "response data"
): T {
  const body = response.json() as { data?: unknown };
  expect(body).toHaveProperty("data");

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    throw new Error(
      `${label} failed API contract validation: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
