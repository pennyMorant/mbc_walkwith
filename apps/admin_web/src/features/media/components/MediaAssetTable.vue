<script setup lang="ts">
import type { MediaAsset } from "@mbc/api-contracts";

import { formatAdminDate } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

defineProps<{
  assets: MediaAsset[];
  canManage: boolean;
}>();
const emit = defineEmits<{
  edit: [asset: MediaAsset];
}>();
const { locale, t } = useI18n();

function formatDate(value: string) {
  return formatAdminDate(value, locale.value);
}

function formatSize(sizeBytes: number) {
  const useMegabytes = sizeBytes >= 1024 * 1024;
  return new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit: useMegabytes ? "megabyte" : "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: 1
  }).format(useMegabytes ? sizeBytes / (1024 * 1024) : sizeBytes / 1024);
}
</script>

<template>
  <AdminResponsiveTable>
    <template #desktop>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>{{ t("media.asset") }}</th>
        <th>{{ t("media.visibility") }}</th>
        <th>{{ t("media.consentStatus") }}</th>
        <th>{{ t("media.size") }}</th>
        <th>{{ t("Updated") }}</th>
        <th class="text-end">{{ t("common.actions") }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="asset in assets" :key="asset.id">
        <td>
          <div class="asset-cell">
            <v-img
              v-if="asset.url"
              :src="asset.url"
              :alt="asset.altText"
              width="72"
              height="48"
              cover
              class="asset-thumbnail"
            />
            <div v-else class="asset-thumbnail asset-placeholder">
              <v-icon icon="mdi-image-lock-outline" />
            </div>
            <div class="asset-copy">
              <div class="font-weight-medium">
                {{ asset.altText || asset.originalFileName }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ asset.originalFileName }}
              </div>
            </div>
          </div>
        </td>
        <td>
          <v-chip size="small" variant="tonal">
            {{ t(asset.visibility) }}
          </v-chip>
        </td>
        <td>
          <v-chip size="small" variant="tonal">
            {{ t(asset.consentStatus) }}
          </v-chip>
        </td>
        <td class="text-no-wrap">{{ formatSize(asset.sizeBytes) }}</td>
        <td class="text-no-wrap">{{ formatDate(asset.updatedAt) }}</td>
        <td class="text-end">
          <v-btn
            v-if="canManage"
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            :aria-label="t('media.editTitle')"
            @click="emit('edit', asset)"
          />
          <span v-else class="text-medium-emphasis">-</span>
        </td>
      </tr>
    </tbody>
  </v-table>
    </template>
    <template #mobile>
  <div>
    <component
      :is="canManage ? 'button' : 'div'"
      v-for="asset in assets"
      :key="asset.id"
      class="asset-record"
      :class="{ 'asset-record--interactive': canManage }"
      :type="canManage ? 'button' : undefined"
      @click="canManage && emit('edit', asset)"
    >
      <v-img
        v-if="asset.url"
        :src="asset.url"
        :alt="asset.altText"
        width="72"
        height="52"
        cover
        class="asset-thumbnail"
      />
      <div v-else class="asset-thumbnail asset-placeholder mobile-thumbnail">
        <v-icon icon="mdi-image-lock-outline" />
      </div>
      <div class="asset-copy text-start">
        <div class="font-weight-medium">
          {{ asset.altText || asset.originalFileName }}
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ formatSize(asset.sizeBytes) }} · {{ formatDate(asset.updatedAt) }}
        </div>
        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-chip size="x-small" variant="tonal">
            {{ t(asset.visibility) }}
          </v-chip>
          <v-chip size="x-small" variant="tonal">
            {{ t(asset.consentStatus) }}
          </v-chip>
        </div>
      </div>
      <v-icon
        v-if="canManage"
        icon="mdi-chevron-right"
        size="small"
        class="text-medium-emphasis"
      />
    </component>
  </div>
    </template>
  </AdminResponsiveTable>
</template>

<style scoped>
.asset-cell {
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-thumbnail {
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface-variant));
}

.asset-placeholder {
  width: 72px;
  height: 48px;
  display: grid;
  place-items: center;
}

.asset-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}

.asset-record {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 14px 16px;
  color: inherit;
  background: transparent;
  font: inherit;
}

.asset-record--interactive {
  cursor: pointer;
}

.asset-record--interactive:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.mobile-thumbnail {
  width: 72px;
  height: 52px;
}
</style>
