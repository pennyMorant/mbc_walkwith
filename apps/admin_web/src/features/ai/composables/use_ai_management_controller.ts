import type {
  AiBudgetPolicy,
  AiModelPolicy,
  AiProviderConfig
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  getAiManagement,
  saveAiBudget,
  saveAiModelPolicy,
  saveAiProvider,
  testAiProvider
} from "@/core/api/ai";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  budgetMatchesIntent,
  budgetSaveIntent,
  policyMatchesIntent,
  policySaveIntent,
  providerFormMatchesIntent,
  providerSaveIntent,
  type AiBudgetSaveIntent,
  type AiPolicySaveIntent,
  type AiProviderForm,
  type AiProviderSaveIntent
} from "../ai_management_models";

type ProviderTestIntent = Readonly<{
  editorSession: number;
  providerId: string;
}>;

export function useAiManagementController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const selectedProviderId = ref("");
  const providerEditorSession = ref(0);
  const activeTab = ref("providers");
  const policyForms = ref<AiModelPolicy[]>([]);
  const providerForm = reactive<AiProviderForm>(emptyProviderForm());
  const budgetForm = reactive<AiBudgetPolicy>({
    monthlyTokenLimit: null,
    dailyTokenLimit: null
  });
  let providersHydrated = false;
  let policiesHydrated = false;
  let budgetHydrated = false;

  const managementQuery = useQuery({
    queryKey: ["ai-management"],
    queryFn: getAiManagement,
    enabled: () => authStore.can("ai:read")
  });
  const providers = computed(() => managementQuery.data.value?.providers ?? []);
  const canManage = computed(() => authStore.can("ai:manage"));
  const overviewMetrics = computed(() => [
    {
      id: "today",
      label: t("ai.todayTokens"),
      value: managementQuery.data.value?.todayTokens ?? 0,
      icon: "mdi-calendar-today-outline",
      tone: "primary" as const
    },
    {
      id: "month",
      label: t("ai.monthTokens"),
      value: managementQuery.data.value?.monthTokens ?? 0,
      icon: "mdi-calendar-month-outline",
      tone: "info" as const
    },
    {
      id: "limit",
      label: t("ai.monthlyTokenLimit"),
      value:
        managementQuery.data.value?.budget.monthlyTokenLimit ??
        t("ai.notConfigured"),
      icon: "mdi-speedometer",
      tone: "secondary" as const
    }
  ]);

  const providerMutation = useMutation({
    mutationFn: (intent: AiProviderSaveIntent) =>
      saveAiProvider(intent.provider),
    onSuccess: async (provider, intent) => {
      if (
        intent.editorSession === providerEditorSession.value &&
        providerFormMatchesIntent(providerForm, intent)
      ) {
        selectedProviderId.value = provider.id;
        populateProvider(provider);
      }
      await refreshManagement();
    }
  });
  const policyMutation = useMutation({
    mutationFn: (intent: AiPolicySaveIntent) =>
      saveAiModelPolicy(intent.policy),
    onSuccess: async (policy, intent) => {
      const current = policyForms.value.find(
        (item) => item.capability === intent.policy.capability
      );
      if (current && policyMatchesIntent(current, intent)) {
        Object.assign(current, policy);
      }
      await refreshManagement();
    }
  });
  const providerTestMutation = useMutation({
    mutationFn: (intent: ProviderTestIntent) =>
      testAiProvider(intent.providerId),
    onSuccess: () => refreshManagement()
  });
  const budgetMutation = useMutation({
    mutationFn: (intent: AiBudgetSaveIntent) => saveAiBudget(intent.budget),
    onSuccess: async (budget, intent) => {
      if (budgetMatchesIntent(budgetForm, intent)) {
        Object.assign(budgetForm, budget);
      }
      await refreshManagement();
    }
  });

  watch(
    () => managementQuery.data.value,
    (overview) => {
      if (!overview) return;
      if (!providersHydrated) {
        providersHydrated = true;
        const firstProvider = overview.providers[0];
        if (firstProvider) selectProvider(firstProvider.id);
      }
      if (!policiesHydrated) {
        policiesHydrated = true;
        policyForms.value = overview.policies.map((policy) => ({ ...policy }));
      }
      if (!budgetHydrated) {
        budgetHydrated = true;
        Object.assign(budgetForm, overview.budget);
      }
    },
    { immediate: true }
  );

  const queryErrorMessage = computed(() =>
    formatApiErrorMessage(managementQuery.error.value, t("common.error"))
  );
  const initialQueryErrorMessage = computed(() =>
    managementQuery.data.value ? "" : queryErrorMessage.value
  );
  const refreshErrorMessage = computed(() =>
    managementQuery.data.value ? queryErrorMessage.value : ""
  );
  const providerErrorMessage = computed(() => {
    const saveError =
      providerMutation.variables.value?.editorSession ===
      providerEditorSession.value
        ? providerMutation.error.value
        : null;
    const testError = isCurrentProviderTest.value
      ? providerTestMutation.error.value
      : null;
    return formatApiErrorMessage(saveError || testError, t("common.error"));
  });
  const policyErrorMessage = computed(() =>
    formatApiErrorMessage(policyMutation.error.value, t("common.error"))
  );
  const budgetErrorMessage = computed(() =>
    formatApiErrorMessage(budgetMutation.error.value, t("common.error"))
  );
  const isCurrentProviderTest = computed(
    () =>
      providerTestMutation.variables.value?.editorSession ===
        providerEditorSession.value &&
      providerTestMutation.variables.value?.providerId ===
        selectedProviderId.value
  );
  const visibleProviderTestResult = computed(() =>
    isCurrentProviderTest.value
      ? providerTestMutation.data.value ?? null
      : null
  );
  const providerSavePending = computed(
    () =>
      providerMutation.isPending.value &&
      providerMutation.variables.value?.editorSession ===
        providerEditorSession.value
  );
  const providerTestPending = computed(
    () => providerTestMutation.isPending.value && isCurrentProviderTest.value
  );
  const isManagementCommandBusy = computed(
    () =>
      providerMutation.isPending.value ||
      providerTestMutation.isPending.value ||
      policyMutation.isPending.value ||
      budgetMutation.isPending.value
  );
  const policySavingCapability = computed(() =>
    policyMutation.isPending.value
      ? policyMutation.variables.value?.policy.capability ?? null
      : null
  );

  function populateProvider(provider: AiProviderConfig) {
    Object.assign(providerForm, {
      id: provider.id,
      label: provider.label,
      type: provider.type,
      enabled: provider.enabled,
      baseUrl: provider.baseUrl ?? "",
      apiKey: "",
      defaultModel: provider.defaultModel
    });
  }

  function newProvider() {
    providerEditorSession.value += 1;
    selectedProviderId.value = "";
    Object.assign(providerForm, emptyProviderForm(`provider_${Date.now()}`));
  }

  function selectProvider(id: string) {
    const provider = providers.value.find((item) => item.id === id);
    if (!provider) return;
    providerEditorSession.value += 1;
    selectedProviderId.value = id;
    populateProvider(provider);
  }

  function saveProvider() {
    if (isManagementCommandBusy.value) return;
    providerMutation.mutate(
      providerSaveIntent(providerForm, providerEditorSession.value)
    );
  }

  function testSelectedProvider() {
    if (!selectedProviderId.value || isManagementCommandBusy.value) {
      return;
    }
    providerTestMutation.mutate({
      editorSession: providerEditorSession.value,
      providerId: selectedProviderId.value
    });
  }

  function savePolicy(policy: AiModelPolicy) {
    if (isManagementCommandBusy.value) return;
    policyMutation.mutate(policySaveIntent(policy));
  }

  function saveBudget() {
    if (isManagementCommandBusy.value) return;
    budgetMutation.mutate(budgetSaveIntent(budgetForm));
  }

  function refreshManagement() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["ai-management"]
    });
  }

  return {
    activeTab,
    budgetForm,
    budgetErrorMessage,
    budgetPending: budgetMutation.isPending,
    canManage,
    isManagementCommandBusy,
    initialQueryErrorMessage,
    managementQuery,
    overviewMetrics,
    policyErrorMessage,
    policyForms,
    policySavingCapability,
    providerErrorMessage,
    providerForm,
    providers,
    providerSavePending,
    providerTestPending,
    refreshErrorMessage,
    selectedProviderId,
    visibleProviderTestResult,
    newProvider,
    refreshManagement,
    saveBudget,
    savePolicy,
    saveProvider,
    selectProvider,
    testSelectedProvider
  };
}

function emptyProviderForm(id = ""): AiProviderForm {
  return {
    id,
    label: "",
    type: "openai",
    enabled: true,
    baseUrl: "",
    apiKey: "",
    defaultModel: "gpt-4o-mini"
  };
}
