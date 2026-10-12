import {
  publicLandingActionSchema,
  publicLandingAppSectionSchema,
  publicLandingContactSectionSchema,
  publicLandingEntranceSectionSchema,
  publicLandingHeroSchema,
  publicLandingIdentitySchema,
  publicLandingMissionSectionSchema,
  publicLandingServiceSectionSchema
} from "@mbc/api-contracts";
import { z } from "zod";

import { settingValueInvalid } from "../settings/settings-errors.js";
import {
  publicLandingSettingKeyParts,
  type PublicLandingSettingId
} from "./public_landing_defaults.js";

const actionListSchema = z.array(publicLandingActionSchema);

export const publicLandingSettingSchemaById = new Map<
  PublicLandingSettingId,
  z.ZodTypeAny
>([
  ["identity", publicLandingIdentitySchema],
  ["brandAction", publicLandingActionSchema],
  ["navigation", actionListSchema],
  ["headerActions", actionListSchema],
  ["mobileActions", actionListSchema],
  ["hero", publicLandingHeroSchema],
  ["mission", publicLandingMissionSectionSchema],
  ["service", publicLandingServiceSectionSchema],
  ["entrance", publicLandingEntranceSectionSchema],
  ["app", publicLandingAppSectionSchema],
  ["contact", publicLandingContactSectionSchema],
  ["footerActions", actionListSchema]
]);

export type PublicLandingSettingParseResult =
  | { handled: false }
  | { handled: true; value: unknown };

export function parsePublicLandingSettingValue(
  key: string,
  value: unknown
): PublicLandingSettingParseResult {
  const parts = publicLandingSettingKeyParts(key);
  if (!parts) {
    return { handled: false };
  }

  const schema = publicLandingSettingSchemaById.get(parts.id);
  if (!schema) {
    return { handled: false };
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw settingValueInvalid(key, parsed.error.flatten());
  }

  return { handled: true, value: parsed.data };
}
