<script setup lang="ts">
import type {
  AiManagedProviderType,
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

import AiUsagePanel from "../components/AiUsagePanel.vue";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const selectedProviderId = ref("");
const activeTab = ref("providers");
const policyForms = ref<AiModelPolicy[]>([]);
const providerForm = reactive({
  id: "",
  label: "",
  type: "openai" as AiManagedProviderType,
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
  onSuccess: async () => {
    providerForm.apiKey = "";
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
  selectedProviderId.value = id;
}

const errorMessage = computed(() =>
  formatApiErrorMessage(
    providerMutation.error.value || policyMutation.error.value || budgetMutation.error.value || providerTestMutation.error.value,
    t("common.error")
  )
);

const providerTestResult = computed(() => providerTestMutation.data.value ?? null);

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
        <v-row>
          <v-col cols="12" md="4"><v-card><v-list density="comfortable"><v-list-item v-for="provider in providers" :key="provider.id" :title="provider.label" :subtitle="`${provider.type} · ${provider.defaultModel}`" :active="provider.id === selectedProviderId" @click="selectProvider(provider.id)"><template #append><v-chip size="x-small" :color="provider.enabled ? 'success' : 'warning'">{{ provider.enabled ? t("common.enabled") : t("common.disabled") }}</v-chip></template></v-list-item></v-list><v-card-actions v-if="canManage"><v-btn prepend-icon="mdi-plus" variant="text" @click="newProvider">{{ t("ai.addProvider") }}</v-btn></v-card-actions></v-card></v-col>
          <v-col cols="12" md="8"><v-card><v-card-title>{{ t("ai.connection") }}</v-card-title><v-card-text><v-row><v-col cols="12" sm="6"><v-text-field v-model="providerForm.id" :label="t('common.internalKey')" :disabled="!canManage" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="providerForm.label" :label="t('ai.displayName')" :disabled="!canManage" /></v-col><v-col cols="12" sm="6"><v-select v-model="providerForm.type" :items="['openai', 'gemini', 'openai_compatible']" :label="t('ai.providerType')" :disabled="!canManage" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="providerForm.defaultModel" :label="t('ai.defaultModel')" :disabled="!canManage" /></v-col><v-col cols="12"><v-text-field v-model="providerForm.baseUrl" :label="t('ai.baseUrl')" :disabled="!canManage" /></v-col><v-col cols="12"><v-text-field v-model="providerForm.apiKey" type="password" :label="t('ai.apiKey')" :hint="t('ai.apiKeyHint')" persistent-hint :disabled="!canManage" /></v-col><v-col cols="12"><v-switch v-model="providerForm.enabled" :label="t('common.enabled')" :disabled="!canManage" /></v-col></v-row><v-alert v-if="providerTestResult" :type="providerTestResult.ok ? 'success' : 'error'" variant="tonal">{{ providerTestResult.ok ? t('ai.testSucceeded') : t('ai.testFailed') }} · {{ providerTestResult.provider }}{{ providerTestResult.model ? ` / ${providerTestResult.model}` : '' }}{{ providerTestResult.errorCode ? ` (${providerTestResult.errorCode})` : '' }}</v-alert></v-card-text><v-card-actions><v-btn color="primary" :loading="providerMutation.isPending.value" :disabled="!canManage || !providerForm.id || !providerForm.label || !providerForm.defaultModel" @click="providerMutation.mutate()">{{ t("common.save") }}</v-btn><v-btn variant="tonal" :loading="providerTestMutation.isPending.value" :disabled="!canManage || !providerForm.id" @click="providerTestMutation.mutate(providerForm.id)">{{ t("ai.testConnection") }}</v-btn></v-card-actions></v-card></v-col>
        </v-row>
      </v-window-item>
      <v-window-item value="policies"><v-card><v-card-title>{{ t("ai.taskPolicies") }}</v-card-title><v-table><thead><tr><th>{{ t("ai.capability") }}</th><th>{{ t("ai.provider") }}</th><th>{{ t("ai.model") }}</th><th>{{ t("ai.fallbackProvider") }}</th><th>{{ t("ai.fallbackModel") }}</th><th>{{ t("ai.timeout") }}</th><th>{{ t("ai.maxOutput") }}</th><th /></tr></thead><tbody><tr v-for="policy in policyForms" :key="policy.capability"><td>{{ policy.capability }}</td><td><v-select v-model="policy.providerId" :items="providers.map((item) => ({ title: item.label, value: item.id }))" density="compact" hide-details :disabled="!canManage" /></td><td><v-text-field v-model="policy.model" density="compact" hide-details :disabled="!canManage" /></td><td><v-select v-model="policy.fallbackProviderId" :items="[{ title: t('common.notSet'), value: null }, ...providers.filter((item) => item.id !== policy.providerId).map((item) => ({ title: item.label, value: item.id }))]" density="compact" hide-details :disabled="!canManage" /></td><td><v-text-field v-model="policy.fallbackModel" density="compact" hide-details :disabled="!canManage || !policy.fallbackProviderId" /></td><td><v-text-field v-model.number="policy.timeoutMs" type="number" density="compact" hide-details :disabled="!canManage" /></td><td><v-text-field v-model.number="policy.maxOutputTokens" type="number" density="compact" hide-details :disabled="!canManage" /></td><td><v-btn icon="mdi-content-save" variant="text" :disabled="!canManage" :loading="policyMutation.isPending.value" @click="policyMutation.mutate(policy)" /></td></tr></tbody></v-table></v-card></v-window-item>
      <v-window-item value="usage">
        <AiUsagePanel :records="managementQuery.data.value?.usage ?? []" />
      </v-window-item>
      <v-window-item value="budget"><v-card><v-card-title>{{ t("ai.tokenLimits") }}</v-card-title><v-card-text><v-row><v-col cols="12" md="6"><v-text-field v-model.number="budgetForm.monthlyTokenLimit" type="number" :label="t('ai.monthlyTokenLimit')" :disabled="!canManage" /></v-col><v-col cols="12" md="6"><v-text-field v-model.number="budgetForm.dailyTokenLimit" type="number" :label="t('ai.dailyTokenLimit')" :disabled="!canManage" /></v-col></v-row></v-card-text><v-card-actions><v-btn color="primary" :loading="budgetMutation.isPending.value" :disabled="!canManage" @click="budgetMutation.mutate()">{{ t("common.save") }}</v-btn></v-card-actions></v-card></v-window-item>
    </v-window>
  </div>
</template>
