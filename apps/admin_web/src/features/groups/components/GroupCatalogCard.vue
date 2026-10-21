<script setup lang="ts">
import type { MinistryGroup } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  canManage: boolean;
  errorMessage: string;
  groups: MinistryGroup[];
  pending: boolean;
  selectedGroupId: string | null;
}>();

defineEmits<{
  edit: [group: MinistryGroup];
  retry: [];
  select: [group: MinistryGroup];
}>();

const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="groups.length === 0"
      :empty-title="t('No groups match the current filters.')"
      empty-icon="mdi-account-group-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-list lines="three">
        <v-list-item
          v-for="group in groups"
          :key="group.id"
          :active="selectedGroupId === group.id"
          @click="$emit('select', group)"
        >
          <template #title>
            <div class="font-weight-bold">{{ group.name }}</div>
          </template>
          <template #subtitle>
            <div>{{ group.leaderName || t("common.notSet") }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t(group.status) }} · {{ group.memberCount }}/{{
                group.capacity ?? "∞"
              }}
            </div>
          </template>
          <template #append>
            <v-btn
              v-if="canManage"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              :aria-label="t('Edit group')"
              @click.stop="$emit('edit', group)"
            />
          </template>
        </v-list-item>
      </v-list>
    </AdminDataState>
  </v-card>
</template>
