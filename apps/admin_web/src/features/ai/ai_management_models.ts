import type { AiManagedProviderType } from "@mbc/api-contracts";

export type AiProviderForm = {
  id: string;
  label: string;
  type: AiManagedProviderType;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
};
