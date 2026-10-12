import {
  adminAiDraftRequestSchema,
  aiBudgetPolicySchema,
  aiDraftResponseSchema,
  aiManagementOverviewSchema,
  aiModelPolicySchema,
  aiProviderConfigSchema,
  aiProviderTestResultSchema,
  aiStatusResponseSchema,
  type AdminAiDraftRequest,
  type AiDraftResponse,
  type AiStatusResponse,
  type AiBudgetPolicy,
  type AiManagementOverview,
  type AiModelPolicyUpdate,
  type AiProviderConfig,
  type AiProviderConfigUpdate,
  type AiProviderTestResult
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export async function getAdminAiStatus(): Promise<AiStatusResponse> {
  return apiClient.getData("/admin/ai/status", aiStatusResponseSchema);
}

export async function createAdminAiDraft(
  input: AdminAiDraftRequest
): Promise<AiDraftResponse> {
  const payload = adminAiDraftRequestSchema.parse(input);
  const response = await apiClient.postData(
    "/admin/ai/drafts",
    payload,
    aiDraftResponseSchema
  );
  if (response.task !== payload.task) {
    throw new Error(
      `AI response task ${response.task} does not match ${payload.task}.`
    );
  }
  return response;
}

export async function getAiManagement(): Promise<AiManagementOverview> {
  return apiClient.getData("/admin/ai/management", aiManagementOverviewSchema);
}

export async function saveAiProvider(
  input: AiProviderConfigUpdate
): Promise<AiProviderConfig> {
  const { id, ...body } = input;
  return apiClient.putData(
    `/admin/ai/providers/${encodeURIComponent(id)}`,
    { ...body, baseUrl: body.baseUrl?.trim() || null },
    aiProviderConfigSchema
  );
}

export async function testAiProvider(id: string): Promise<AiProviderTestResult> {
  return apiClient.postData(
    `/admin/ai/providers/${encodeURIComponent(id)}/test`,
    {},
    aiProviderTestResultSchema
  );
}

export async function saveAiModelPolicy(input: AiModelPolicyUpdate) {
  const { capability, ...body } = input;
  return apiClient.putData(
    `/admin/ai/policies/${encodeURIComponent(capability)}`,
    body,
    aiModelPolicySchema
  );
}

export async function saveAiBudget(input: AiBudgetPolicy) {
  return apiClient.putData("/admin/ai/budget", input, aiBudgetPolicySchema);
}
