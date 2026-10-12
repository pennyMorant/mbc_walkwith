<script setup lang="ts">
import type { GivingFund } from "@mbc/api-contracts";
import { computed } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  fund: GivingFund | null;
  canManage: boolean;
  canSave: boolean;
  codeValid: boolean;
  dollars: (amountCents: number | undefined) => string;
  error: unknown;
  form: {
    code: string;
    name: string;
    description: string;
    status: GivingFund["status"];
    targetAmountDollars: string;
    displayOrder: number;
  };
  isSaving: boolean;
  save: () => void;
}>();

const drawer = defineModel<boolean>({ required: true });
const { t } = useI18n();

const statusItems = computed(() =>
  ["draft", "active", "paused", "archived"].map((status) => ({
    title: t(status),
    value: status
  }))
);
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="right" temporary width="420">
    <div class="pa-5">
      <div class="text-h6 font-weight-bold">
        {{ fund ? fund.name : t("New giving fund") }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        {{
          fund
            ? fund.description || fund.code
            : t("Create a restricted giving purpose.")
        }}
      </div>
      <v-divider class="my-4" />

      <v-form @submit.prevent="save">
        <v-text-field
          v-model="form.code"
          :disabled="fund !== null || !canManage || isSaving"
          :error-messages="
            form.code.trim() && !codeValid
              ? [t('Fund code must use lowercase letters, numbers, hyphens, or underscores.')]
              : []
          "
          :label="t('Code')"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="form.name"
          :disabled="!canManage || isSaving"
          :label="t('Name')"
          density="comfortable"
          variant="outlined"
        />
        <v-textarea
          v-model="form.description"
          :disabled="!canManage || isSaving"
          :label="t('Description')"
          density="comfortable"
          rows="3"
          variant="outlined"
        />
        <v-select
          v-model="form.status"
          :disabled="!canManage || isSaving"
          :items="statusItems"
          :label="t('Status')"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="form.targetAmountDollars"
          :disabled="!canManage || isSaving"
          :label="t('Target amount')"
          density="comfortable"
          inputmode="decimal"
          variant="outlined"
        />
        <v-text-field
          v-model.number="form.displayOrder"
          :disabled="!canManage || isSaving"
          :label="t('Display order')"
          density="comfortable"
          type="number"
          variant="outlined"
        />

        <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
          {{ formatApiErrorMessage(error, t("common.error")) }}
        </v-alert>

        <v-btn
          v-if="canManage"
          block
          color="primary"
          type="submit"
          :disabled="!canSave"
          :loading="isSaving"
        >
          {{ t("common.save") }}
        </v-btn>
      </v-form>

      <div v-if="fund" class="d-flex flex-column ga-3 mt-5">
        <div>
          <div class="text-caption text-medium-emphasis">{{ t("Status") }}</div>
          <div class="font-weight-bold">{{ t(fund.status) }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">{{ t("Total") }}</div>
          <div class="font-weight-bold">
            {{ dollars(fund.totalAmountCents) }}
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">
            {{ t("Transactions") }}
          </div>
          <div class="font-weight-bold">
            {{ fund.transactionCount }}
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">
            {{ t("Target") }}
          </div>
          <div class="font-weight-bold">
            {{
              fund.targetAmountCents == null
                ? t("Not set")
                : dollars(fund.targetAmountCents)
            }}
          </div>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
</template>
