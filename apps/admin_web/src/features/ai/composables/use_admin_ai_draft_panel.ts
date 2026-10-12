import {
  adminAiDraftRequestSchema,
  type AdminAiTask,
  type AiDraftResponse,
  type AiLocale,
  type AiResourceReference,
  type AiTaskInput
} from "@mbc/api-contracts";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { computed, nextTick, ref, watch, type Ref } from "vue";

import { createAdminAiDraft, getAdminAiStatus } from "@/core/api/ai";
import {
  formatApiErrorMessage,
  isApiRequestError
} from "@/core/api/api_errors";
import {
  adminAiRequestIdentity,
  beginAdminAiRequest,
  createAdminAiRequestState,
  hasAdminAiTaskInput,
  invalidateAdminAiRequest,
  isAdminAiRequestPending,
  isCurrentAdminAiRequest,
  isCurrentAdminAiDraftResult,
  prepareAdminAiTaskInput,
  settleAdminAiRequest
} from "../admin_ai_request_values";

type Translate = (key: string) => string;
type AdminAiDraftRequestCandidate = {
  task: AdminAiTask;
  locale: AiLocale;
  input: AiTaskInput;
  resource?: AiResourceReference;
};

export function useAdminAiDraftPanel(input: {
  task: Ref<AdminAiTask>;
  taskInput: Ref<AiTaskInput>;
  resource: Ref<AiResourceReference | undefined>;
  canUse: Ref<boolean>;
  disabled: Ref<boolean>;
  locale: Ref<AiLocale>;
  t: Translate;
  onApply: (markdown: string, response: AiDraftResponse) => void;
}) {
  const draftMarkdown = ref("");
  const latestResponse = ref<AiDraftResponse | null>(null);
  const draftIdentity = ref<string | null>(null);
  const draftApplied = ref(false);
  const requestError = ref<unknown>(null);
  const requestState = ref(createAdminAiRequestState());

  const statusQuery = useQuery({
    queryKey: ["admin-ai-status"],
    queryFn: getAdminAiStatus,
    enabled: input.canUse,
    staleTime: 60_000
  });

  const preparedInput = computed(() =>
    prepareAdminAiTaskInput(input.taskInput.value)
  );
  const requestIdentity = computed(() =>
    adminAiRequestIdentity({
      task: input.task.value,
      locale: input.locale.value,
      taskInput: preparedInput.value,
      ...(input.resource.value ? { resource: input.resource.value } : {})
    })
  );

  const generateMutation = useMutation({
    mutationFn: async (variables: {
      identity: string;
      serial: number;
      request: AdminAiDraftRequestCandidate;
    }) => ({
      identity: variables.identity,
      serial: variables.serial,
      response: await createAdminAiDraft(
        adminAiDraftRequestSchema.parse(variables.request)
      )
    }),
    onSuccess: ({ identity, serial, response }) => {
      if (!isCurrentAdminAiDraftResult({
        responseTask: response.task,
        activeTask: input.task.value,
        responseIdentity: identity,
        activeIdentity: requestIdentity.value,
        responseSerial: serial,
        activeSerial: requestState.value.serial
      })) {
        return;
      }
      latestResponse.value = response;
      draftMarkdown.value = response.markdown;
      draftIdentity.value = identity;
    },
    onError: (error, variables) => {
      if (!isCurrentAdminAiRequest({
        responseIdentity: variables.identity,
        activeIdentity: requestIdentity.value,
        responseSerial: variables.serial,
        activeSerial: requestState.value.serial
      })) {
        return;
      }
      requestError.value = error;
    },
    onSettled: (_data, _error, variables) => {
      requestState.value = settleAdminAiRequest(
        requestState.value,
        variables.serial
      );
    }
  });

  const status = computed(() => statusQuery.data.value);
  const hasInput = computed(() => hasAdminAiTaskInput(preparedInput.value));
  const taskSupported = computed(
    () => status.value?.supportedAdminTasks.includes(input.task.value) ?? false
  );
  const isGenerating = computed(() =>
    isAdminAiRequestPending(requestState.value)
  );
  const providerLabel = computed(() => {
    if (!input.canUse.value || statusQuery.isError.value) {
      return input.t("ai.statusUnavailable");
    }
    if (statusQuery.isPending.value) {
      return input.t("ai.statusChecking");
    }
    if (!status.value?.enabled) {
      return input.t("ai.statusDisabled");
    }
    return `${status.value.provider} · ${
      status.value.model ?? input.t("common.notSet")
    }`;
  });
  const canGenerate = computed(
    () =>
      input.canUse.value &&
      !input.disabled.value &&
      hasInput.value &&
      Boolean(status.value?.enabled) &&
      taskSupported.value &&
      !isGenerating.value
  );
  const errorMessage = computed(() =>
    adminAiErrorMessage(
      requestError.value ?? statusQuery.error.value,
      input.t
    )
  );

  watch(requestIdentity, invalidateDraft, { flush: "sync" });

  async function applyDraft() {
    if (
      !latestResponse.value ||
      !draftMarkdown.value.trim() ||
      draftIdentity.value !== requestIdentity.value
    ) {
      return;
    }
    input.onApply(draftMarkdown.value.trim(), latestResponse.value);
    clearDraft();
    await nextTick();
    draftApplied.value = true;
  }

  function generateDraft() {
    if (!canGenerate.value) {
      return;
    }
    generateMutation.reset();
    const request = beginAdminAiRequest(requestState.value);
    if (!request) {
      return;
    }
    requestState.value = request.state;
    const identity = requestIdentity.value;
    clearDraft();
    draftApplied.value = false;
    requestError.value = null;
    generateMutation.mutate({
      identity,
      serial: request.serial,
      request: {
        task: input.task.value,
        locale: input.locale.value,
        input: preparedInput.value,
        ...(input.resource.value ? { resource: input.resource.value } : {})
      }
    });
  }

  function discardDraft() {
    requestState.value = invalidateAdminAiRequest(requestState.value);
    clearDraft();
    draftApplied.value = false;
    requestError.value = null;
    resetMutationIfIdle();
  }

  function invalidateDraft() {
    requestState.value = invalidateAdminAiRequest(requestState.value);
    clearDraft();
    draftApplied.value = false;
    requestError.value = null;
    resetMutationIfIdle();
  }

  function clearDraft() {
    draftMarkdown.value = "";
    latestResponse.value = null;
    draftIdentity.value = null;
  }

  function resetMutationIfIdle() {
    if (!isAdminAiRequestPending(requestState.value)) {
      generateMutation.reset();
    }
  }

  return {
    applyDraft,
    canGenerate,
    discardDraft,
    draftApplied,
    draftMarkdown,
    errorMessage,
    generateDraft,
    hasInput,
    isGenerating,
    latestResponse,
    providerLabel,
    status,
    statusQuery,
    taskSupported
  };
}

function adminAiErrorMessage(error: unknown, t: Translate) {
  if (!error) {
    return "";
  }
  if (isApiRequestError(error)) {
    if (error.hasCode(["ai_provider_disabled", "ai_provider_misconfigured"])) {
      return t("ai.providerDisabled");
    }
    if (error.hasCode("ai_rate_limited")) {
      return t("ai.rateLimited");
    }
    if (error.hasCode("ai_task_input_required")) {
      return t("ai.inputRequired");
    }
    if (error.isPermissionDenied) {
      return t("ai.permissionRequired");
    }
    if (error.isValidationFailure) {
      return t("ai.requestInvalid");
    }
    return formatApiErrorMessage(error, t("ai.requestFailed"));
  }
  return error instanceof TypeError
    ? t("ai.requestFailed")
    : t("ai.requestInvalid");
}
