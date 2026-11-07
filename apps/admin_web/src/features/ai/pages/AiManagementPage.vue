<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

import AiBudgetPanel from "../components/AiBudgetPanel.vue";
import AiPolicyPanel from "../components/AiPolicyPanel.vue";
import AiProviderWorkspace from "../components/AiProviderWorkspace.vue";
import AiUsagePanel from "../components/AiUsagePanel.vue";
import { useAiManagementController } from "../composables/use_ai_management_controller";

const { t } = useI18n();
const {
  activeTab,
  budgetErrorMessage,
  budgetForm,
  budgetPending,
  canManage,
  initialQueryErrorMessage,
  isManagementCommandBusy,
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
} = useAiManagementController();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('ai.title')" :subtitle="t('ai.subtitle')">
      <template #actions>
        <v-btn
          prepend-icon="mdi-refresh"
          variant="tonal"
          :loading="managementQuery.isFetching.value"
          @click="refreshManagement"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <AdminDataState
      class="mt-4"
      :pending="managementQuery.isPending.value && !managementQuery.data.value"
      :error-message="initialQueryErrorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="refreshManagement"
    >
      <AdminRetryAlert
        :message="refreshErrorMessage"
        :retry-label="t('common.refresh')"
        class="mb-4"
        @retry="refreshManagement"
      />
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
            :command-busy="isManagementCommandBusy"
            :save-pending="providerSavePending"
            :test-pending="providerTestPending"
            :test-result="visibleProviderTestResult"
            :error-message="providerErrorMessage"
            @select="selectProvider"
            @create="newProvider"
            @save="saveProvider"
            @test="testSelectedProvider"
          />
        </v-window-item>
        <v-window-item value="policies">
          <AiPolicyPanel
            v-model:policies="policyForms"
            :providers="providers"
            :can-manage="canManage"
            :command-busy="isManagementCommandBusy"
            :saving-capability="policySavingCapability"
            :error-message="policyErrorMessage"
            @save="savePolicy"
          />
        </v-window-item>
        <v-window-item value="usage">
          <AiUsagePanel :records="managementQuery.data.value?.usage ?? []" />
        </v-window-item>
        <v-window-item value="budget">
          <AiBudgetPanel
            v-model="budgetForm"
            :can-manage="canManage"
            :command-busy="isManagementCommandBusy"
            :pending="budgetPending"
            :error-message="budgetErrorMessage"
            @save="saveBudget"
          />
        </v-window-item>
      </v-window>
    </AdminDataState>
  </div>
</template>
