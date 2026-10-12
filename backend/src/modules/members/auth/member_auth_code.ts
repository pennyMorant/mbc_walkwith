import { timingSafeEqual } from "node:crypto";

export function memberAuthCodeMatches(
  expectedHash: string,
  actualHash: string
) {
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
