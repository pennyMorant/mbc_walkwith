<script setup lang="ts">
import type {
  AiProviderConfig,
  AiProviderTestResult
} from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

import type { AiProviderForm } from "../ai_management_models";

const form = defineModel<AiProviderForm>("form", { required: true });
const props = defineProps<{
  providers: AiProviderConfig[];
  selectedProviderId: string;
  canManage: boolean;
  commandBusy: boolean;
  savePending: boolean;
  testPending: boolean;
  testResult: AiProviderTestResult | null;
  errorMessage: string;
}>();

defineEmits<{
  select: [id: string];
  create: [];
  save: [];
  test: [];
}>();

const { t } = useI18n();
const selectedProvider = computed(() =>
  props.providers.find((provider) => provider.id === props.selectedProviderId)
);
const canSave = computed(
  () => Boolean(form.value.id && form.value.label && form.value.defaultModel)
);
</script>

<template>
  <v-row>
    <v-col cols="12" md="4">
      <v-card class="ai-provider-list h-100 overflow-hidden">
        <div class="ai-provider-list__heading">
          <span class="section-heading">{{ t("ai.providers") }}</span>
          <v-btn
            v-if="canManage"
            icon="mdi-plus"
            size="small"
            variant="tonal"
            :aria-label="t('ai.addProvider')"
            @click="$emit('create')"
          />
        </div>

        <v-list v-if="providers.length > 0" class="pa-2" density="comfortable">
          <v-list-item
            v-for="provider in providers"
            :key="provider.id"
            :title="provider.label"
            :subtitle="`${provider.type} · ${provider.defaultModel}`"
            :active="provider.id === selectedProviderId"
            rounded="lg"
            color="primary"
            @click="$emit('select', provider.id)"
          >
            <template #prepend>
              <v-icon icon="mdi-connection" />
            </template>
            <template #append>
              <v-chip
                size="x-small"
                variant="tonal"
                :color="provider.enabled ? 'success' : 'warning'"
              >
                {{ provider.enabled ? t("common.enabled") : t("common.disabled") }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <div v-else class="ai-provider-list__empty">
          <v-icon icon="mdi-connection" color="secondary" />
          <span>{{ t("ai.notConfigured") }}</span>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="8">
      <v-card class="ai-provider-editor">
        <div class="ai-provider-editor__heading">
          <div>
            <div class="section-heading">{{ t("ai.connection") }}</div>
            <div v-if="selectedProvider?.apiKeyConfigured" class="ai-provider-editor__key-status">
              <v-icon icon="mdi-key-check" size="16" color="success" />
              <span>
                {{ t("ai.apiKey") }}
                <template v-if="selectedProvider.apiKeySuffix">
                  · ••••{{ selectedProvider.apiKeySuffix }}
                </template>
              </span>
            </div>
          </div>
          <v-switch
            v-model="form.enabled"
            color="primary"
            hide-details
            inset
            :label="t('common.enabled')"
            :disabled="!canManage"
          />
        </div>

        <v-card-text class="pt-2">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.id"
                :label="t('common.internalKey')"
                :disabled="!canManage || Boolean(selectedProviderId)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.label"
                :label="t('ai.displayName')"
                :disabled="!canManage"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.type"
                :items="['openai', 'gemini', 'openai_compatible']"
                :label="t('ai.providerType')"
                :disabled="!canManage"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.defaultModel"
                :label="t('ai.defaultModel')"
                :disabled="!canManage"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.baseUrl"
                :label="t('ai.baseUrl')"
                :disabled="!canManage"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.apiKey"
                type="password"
                autocomplete="new-password"
                :label="t('ai.apiKey')"
                :hint="t('ai.apiKeyHint')"
                persistent-hint
                :disabled="!canManage"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="testResult"
            class="mt-2"
            :type="testResult.ok ? 'success' : 'error'"
            variant="tonal"
          >
            {{ testResult.ok ? t("ai.testSucceeded") : t("ai.testFailed") }}
            · {{ testResult.provider }}
            <template v-if="testResult.model"> / {{ testResult.model }}</template>
            <template v-if="testResult.errorCode"> ({{ testResult.errorCode }})</template>
          </v-alert>
          <v-alert
            v-if="errorMessage"
            class="mt-2"
            type="error"
            variant="tonal"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="ai-provider-editor__actions px-4 pb-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save-outline"
            :loading="savePending"
            :disabled="!canManage || !canSave || commandBusy"
            @click="$emit('save')"
          >
            {{ t("common.save") }}
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-access-point-check"
            :loading="testPending"
            :disabled="!canManage || !selectedProviderId || commandBusy"
            @click="$emit('test')"
          >
            {{ t("ai.testConnection") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.ai-provider-list,
.ai-provider-editor { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.ai-provider-list__heading,
.ai-provider-editor__heading { display: flex; min-height: 68px; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; }
.ai-provider-list :deep(.v-list-item + .v-list-item) { margin-top: 4px; }
.ai-provider-list__empty { display: flex; min-height: 132px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: rgba(var(--v-theme-on-surface), 0.62); }
.ai-provider-editor__key-status { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; }
.ai-provider-editor__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }

@media (max-width: 599px) {
  .ai-provider-editor__heading { align-items: flex-start; }
  .ai-provider-editor__actions > :deep(.v-btn) { flex: 1 1 100%; }
}
</style>
