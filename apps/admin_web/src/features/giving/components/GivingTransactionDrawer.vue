<script setup lang="ts">
import type {
  GivingTransaction,
  GivingTransactionStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  transaction: GivingTransaction | null;
  dollars: (amountCents: number | undefined) => string;
  dateTime: (value: string | null | undefined) => string;
  fundName: (fundId: string | null) => string;
  statusColor: (status: GivingTransactionStatus) => string;
}>();

const drawer = defineModel<boolean>({ required: true });
const { t } = useI18n();
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="right" temporary width="460">
    <div v-if="transaction" class="pa-5">
      <div class="text-h6 font-weight-bold">
        {{ t("Giving transaction") }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        {{ transaction.id }}
      </div>

      <v-card class="pa-4 mt-5" variant="outlined">
        <div class="d-flex justify-space-between ga-4">
          <div>
            <div class="text-caption text-medium-emphasis">
              {{ t("Amount") }}
            </div>
            <div class="text-h6 font-weight-bold">
              {{ dollars(transaction.amountCents) }}
            </div>
          </div>
          <v-chip size="small" :color="statusColor(transaction.status)">
            {{ t(transaction.status) }}
          </v-chip>
        </div>
      </v-card>

      <v-list class="mt-4" density="compact">
        <v-list-item
          :title="t('Donor')"
          :subtitle="transaction.donorName || t('Anonymous')"
        />
        <v-list-item
          :title="t('Donor email')"
          :subtitle="transaction.donorEmail || t('common.notSet')"
        />
        <v-list-item
          :title="t('Fund')"
          :subtitle="fundName(transaction.fundId)"
        />
        <v-list-item
          :title="t('Category')"
          :subtitle="t(transaction.category)"
        />
        <v-list-item :title="t('Fees')" :subtitle="dollars(transaction.feeCents)" />
        <v-list-item :title="t('Net')" :subtitle="dollars(transaction.netAmountCents)" />
        <v-list-item
          :title="t('Refunded')"
          :subtitle="dollars(transaction.refundedAmountCents)"
        />
        <v-list-item
          :title="t('Reconciliation')"
          :subtitle="t(transaction.reconciliationStatus)"
        />
        <v-list-item
          :title="t('Payout ID')"
          :subtitle="transaction.payoutId || t('common.notSet')"
        />
        <v-list-item
          :title="t('Available on')"
          :subtitle="dateTime(transaction.availableOn)"
        />
        <v-list-item
          :title="t('Dispute')"
          :subtitle="
            transaction.disputeId
              ? `${transaction.disputeId} · ${t(transaction.disputeStatus)}`
              : t(transaction.disputeStatus)
          "
        />
        <v-list-item
          :title="t('Disputed')"
          :subtitle="dollars(transaction.disputedAmountCents)"
        />
        <v-list-item :title="t('Provider')" :subtitle="transaction.provider" />
        <v-list-item
          :title="t('Provider transaction ID')"
          :subtitle="transaction.providerTransactionId || t('common.notSet')"
        />
        <v-list-item
          :title="t('Checkout session ID')"
          :subtitle="
            transaction.providerCheckoutSessionId || t('common.notSet')
          "
        />
        <v-list-item :title="t('Given')" :subtitle="dateTime(transaction.givenAt)" />
        <v-list-item :title="t('Created')" :subtitle="dateTime(transaction.createdAt)" />
      </v-list>
    </div>
  </v-navigation-drawer>
</template>
