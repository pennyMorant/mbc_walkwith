<script setup lang="ts">
import type {
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
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import type { AiProviderForm } from "../ai_management_models";
import AiBudgetPanel from "../components/AiBudgetPanel.vue";
import AiPolicyPanel from "../components/AiPolicyPanel.vue";
import AiProviderWorkspace from "../components/AiProviderWorkspace.vue";
import AiUsagePanel from "../components/AiUsagePanel.vue";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const selectedProviderId = ref("");
const providerTestTargetId = ref("");
const activeTab = ref("providers");
const policyForms = ref<AiModelPolicy[]>([]);
const providerForm = reactive<AiProviderForm>({
  id: "",
  label: "",
  type: "openai",
  enabled: true,
  baseUrl: "",
  apiKey: "",
  defaultModel: ""
});
const budgetForm = reactive({
  monthlyTokenLimit: null as number | null,
  dailyTokenLimit: null as number | null
});

const managementQuery = useQuery({
  queryKey: ["ai-management"],
  queryFn: getAiManagement,
  enabled: () => authStore.can("ai:read")
});
const providers = computed(() => managementQuery.data.value?.providers ?? []);
const canManage = computed(() => authStore.can("ai:manage"));
const overviewMetrics = computed(() => [
  { id: "today", label: t("ai.todayTokens"), value: managementQuery.data.value?.todayTokens ?? 0, icon: "mdi-calendar-today-outline", tone: "primary" as const },
  { id: "month", label: t("ai.monthTokens"), value: managementQuery.data.value?.monthTokens ?? 0, icon: "mdi-calendar-month-outline", tone: "info" as const },
  { id: "limit", label: t("ai.monthlyTokenLimit"), value: managementQuery.data.value?.budget.monthlyTokenLimit ?? t("ai.notConfigured"), icon: "mdi-speedometer", tone: "secondary" as const }
]);

const providerMutation = useMutation({
  mutationFn: () => saveAiProvider({ ...providerForm }),
  onSuccess: async (provider) => {
    providerForm.apiKey = "";
    selectedProviderId.value = provider.id;
    await queryClient.invalidateQueries({ queryKey: ["ai-management"] });
  }
});
const policyMutation = useMutation({
  mutationFn: (policy: AiModelPolicy) => saveAiModelPolicy(policy),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-management"] })
});
const providerTestMutation = useMutation({
  mutationFn: (id: string) => testAiProvider(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-management"] })
});
const budgetMutation = useMutation({
  mutationFn: () => saveAiBudget({ ...budgetForm }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-management"] })
});

watch(
  providers,
  (items) => {
    if (!selectedProviderId.value && items[0]) selectedProviderId.value = items[0].id;
  },
  { immediate: true }
);
watch(
  [selectedProviderId, providers],
  () => {
    const provider = providers.value.find((item) => item.id === selectedProviderId.value);
    if (provider) populateProvider(provider);
  },
  { immediate: true }
);
watch(
  () => managementQuery.data.value?.budget,
  (budget) => {
    if (!budget) return;
    budgetForm.monthlyTokenLimit = budget.monthlyTokenLimit;
    budgetForm.dailyTokenLimit = budget.dailyTokenLimit;
  },
  { immediate: true }
);
watch(
  () => managementQuery.data.value?.policies,
  (policies) => {
    policyForms.value = (policies ?? []).map((policy) => ({ ...policy }));
  },
  { immediate: true }
);

function populateProvider(provider: AiProviderConfig) {
  providerForm.id = provider.id;
  providerForm.label = provider.label;
  providerForm.type = provider.type;
  providerForm.enabled = provider.enabled;
  providerForm.baseUrl = provider.baseUrl ?? "";
  providerForm.apiKey = "";
  providerForm.defaultModel = provider.defaultModel;
}

function newProvider() {
  providerTestMutation.reset();
  providerTestTargetId.value = "";
  selectedProviderId.value = "";
  Object.assign(providerForm, {
    id: `provider_${Date.now()}`,
    label: "",
    type: "openai",
    enabled: true,
    baseUrl: "",
    apiKey: "",
    defaultModel: "gpt-4o-mini"
  });
}

function selectProvider(id: string) {
  providerTestMutation.reset();
  providerTestTargetId.value = "";
  selectedProviderId.value = id;
}

function testSelectedProvider() {
  if (!selectedProviderId.value) return;
  providerTestTargetId.value = selectedProviderId.value;
  providerTestMutation.mutate(selectedProviderId.value);
}

const visibleProviderTestResult = computed(() =>
  providerTestTargetId.value === selectedProviderId.value
    ? providerTestMutation.data.value ?? null
    : null
);

const errorMessage = computed(() =>
  formatApiErrorMessage(
    providerMutation.error.value ||
      policyMutation.error.value ||
      budgetMutation.error.value ||
      (providerTestTargetId.value === selectedProviderId.value
        ? providerTestMutation.error.value
        : null),
    t("common.error")
  )
);

</script>

<template>
  <div>
    <AdminPageHeader :title="t('ai.title')" :subtitle="t('ai.subtitle')">
      <template #actions>
        <v-btn
          prepend-icon="mdi-refresh"
          variant="tonal"
          :loading="managementQuery.isFetching.value"
          @click="managementQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">{{ errorMessage }}</v-alert>
    <v-progress-linear v-if="managementQuery.isLoading.value" indeterminate color="primary" class="mt-4" />

    <AdminMetricGrid :items="overviewMetrics" />

    <v-tabs v-model="activeTab" class="ai-management-tabs mt-6" color="primary" show-arrows>
      <v-tab value="providers" prepend-icon="mdi-connection">{{ t("ai.providers") }}</v-tab>
      <v-tab value="policies" prepend-icon="mdi-tune-variant">{{ t("ai.policies") }}</v-tab>
      <v-tab value="usage" prepend-icon="mdi-chart-timeline-variant">{{ t("ai.usage") }}</v-tab>
      <v-tab value="budget" prepend-icon="mdi-speedometer">{{ t("ai.budget") }}</v-tab>
    </v-tabs>
    <v-window v-model="activeTab" class="mt-4">
      <v-window-item value="providers">
        <AiProviderWorkspace
          v-model:form="providerForm"
          :providers="providers"
          :selected-provider-id="selectedProviderId"
          :can-manage="canManage"
          :save-pending="providerMutation.isPending.value"
          :test-pending="providerTestMutation.isPending.value"
          :test-result="visibleProviderTestResult"
          @select="selectProvider"
          @create="newProvider"
          @save="providerMutation.mutate()"
          @test="testSelectedProvider"
        />
      </v-window-item>
      <v-window-item value="policies">
        <AiPolicyPanel
          v-model:policies="policyForms"
          :providers="providers"
          :can-manage="canManage"
          :saving-capability="policyMutation.isPending.value ? policyMutation.variables.value?.capability ?? null : null"
          @save="policyMutation.mutate"
        />
      </v-window-item>
      <v-window-item value="usage">
        <AiUsagePanel :records="managementQuery.data.value?.usage ?? []" />
      </v-window-item>
      <v-window-item value="budget">
        <AiBudgetPanel
          v-model="budgetForm"
          :can-manage="canManage"
          :pending="budgetMutation.isPending.value"
          @save="budgetMutation.mutate()"
        />
      </v-window-item>
    </v-window>
  </div>
</template>
