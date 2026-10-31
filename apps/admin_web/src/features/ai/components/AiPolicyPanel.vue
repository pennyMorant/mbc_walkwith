<script setup lang="ts">
import type { AiModelPolicy, AiProviderConfig } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const policies = defineModel<AiModelPolicy[]>("policies", { required: true });
const props = defineProps<{
  providers: AiProviderConfig[];
  canManage: boolean;
  commandBusy: boolean;
  savingCapability: string | null;
  errorMessage: string;
}>();

defineEmits<{ save: [policy: AiModelPolicy] }>();

const { t } = useI18n();

function providerItems(excludedId?: string) {
  return props.providers
    .filter((provider) => provider.id !== excludedId)
    .map((provider) => ({ title: provider.label, value: provider.id }));
}

function capabilityLabel(capability: AiModelPolicy["capability"]) {
  return t(`ai.capability.${capability}`);
}
</script>

<template>
  <div>
    <div class="ai-policy-heading">
      <div>
        <div class="section-heading">{{ t("ai.taskPolicies") }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ t("ai.policyHelp") }}
        </div>
      </div>
    </div>

    <v-row v-if="policies.length > 0" class="mt-1">
      <v-col v-if="errorMessage" cols="12">
        <v-alert type="error" variant="tonal">{{ errorMessage }}</v-alert>
      </v-col>
      <v-col
        v-for="policy in policies"
        :key="policy.capability"
        cols="12"
        xl="6"
      >
        <v-card class="ai-policy-card h-100">
          <div class="ai-policy-card__heading">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ capabilityLabel(policy.capability) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ policy.capability }}
              </div>
            </div>
            <v-btn
              icon="mdi-content-save-outline"
              variant="tonal"
              color="primary"
              :aria-label="t('common.save')"
              :disabled="!canManage || commandBusy"
              :loading="savingCapability === policy.capability"
              @click="$emit('save', policy)"
            />
          </div>

          <v-card-text class="pt-2">
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="policy.providerId"
                  :items="providerItems()"
                  :label="t('ai.provider')"
                  :disabled="!canManage"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="policy.model"
                  :label="t('ai.model')"
                  :disabled="!canManage"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="policy.fallbackProviderId"
                  :items="[
                    { title: t('common.notSet'), value: null },
                    ...providerItems(policy.providerId)
                  ]"
                  :label="t('ai.fallbackProvider')"
                  :disabled="!canManage"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="policy.fallbackModel"
                  :label="t('ai.fallbackModel')"
                  :disabled="!canManage || !policy.fallbackProviderId"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="policy.timeoutMs"
                  type="number"
                  min="1"
                  :label="t('ai.timeout')"
                  :disabled="!canManage"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="policy.maxOutputTokens"
                  type="number"
                  min="1"
                  :label="t('ai.maxOutput')"
                  :disabled="!canManage"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else class="ai-policy-empty mt-4">
      <v-icon icon="mdi-tune-variant" color="secondary" />
      <span>{{ t("ai.notConfigured") }}</span>
    </v-card>
  </div>
</template>

<style scoped>
.ai-policy-heading { display: flex; min-height: 56px; align-items: center; padding: 4px 2px 8px; }
.ai-policy-card { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.ai-policy-card__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px 8px; }
.ai-policy-empty { display: flex; min-height: 120px; align-items: center; justify-content: center; gap: 10px; color: rgba(var(--v-theme-on-surface), 0.62); }
</style>
