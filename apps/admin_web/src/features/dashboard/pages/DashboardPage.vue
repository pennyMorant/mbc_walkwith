<script setup lang="ts">
import type { AdminPermission } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { getAdminDashboard } from "@/core/api/dashboard";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import DashboardHeader from "../components/DashboardHeader.vue";
import DashboardActionQueue from "../components/DashboardActionQueue.vue";
import DashboardMetricGrid from "../components/DashboardMetricGrid.vue";
import DashboardQuickActions, { type DashboardQuickAction } from "../components/DashboardQuickActions.vue";
import DashboardRecentContent from "../components/DashboardRecentContent.vue";
import DashboardSystemHealth from "../components/DashboardSystemHealth.vue";

const router = useRouter();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const dashboardQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard });

const quickActionDefinitions: Array<DashboardQuickAction & { permission: AdminPermission }> = [
  { titleKey: "dashboard.action.sermon", icon: "mdi-microphone-outline", path: "/sermons", tone: "primary", permission: "sermons:create" },
  { titleKey: "dashboard.action.event", icon: "mdi-calendar-plus-outline", path: "/life-posts", tone: "info", permission: "life_posts:update" },
  { titleKey: "dashboard.action.member", icon: "mdi-account-plus-outline", path: "/members", tone: "secondary", permission: "users:manage" },
  { titleKey: "dashboard.action.prayer", icon: "mdi-hands-pray", path: "/prayer", tone: "warning", permission: "prayer:moderate" }
];
const quickActions = computed(() => quickActionDefinitions.filter((action) => authStore.can(action.permission)));
const initialErrorMessage = computed(() =>
  dashboardQuery.error.value && !dashboardQuery.data.value
    ? formatApiErrorMessage(dashboardQuery.error.value, t("common.error"))
    : ""
);
async function open(path: string) { await router.push(path); }
</script>

<template>
  <div class="dashboard-page">
    <DashboardHeader
      :fetching="dashboardQuery.isFetching.value"
      :can-create="authStore.can('life_posts:update')"
      @refresh="dashboardQuery.refetch()"
      @create="open('/life-posts')"
    />

    <div class="mt-7">
      <AdminDataState
        :pending="dashboardQuery.isPending.value && !dashboardQuery.data.value"
        :error-message="initialErrorMessage"
        :empty="false"
        empty-title=""
        :retry-label="t('common.refresh')"
        @retry="dashboardQuery.refetch()"
      >
        <template v-if="dashboardQuery.data.value">
          <v-alert v-if="dashboardQuery.error.value" type="error" variant="tonal">
            {{ formatApiErrorMessage(dashboardQuery.error.value, t("common.error")) }}
          </v-alert>
          <v-alert v-if="dashboardQuery.data.value.snapshot.status === 'stale'" type="warning" variant="tonal" class="mt-4">
            {{ t("dashboard.snapshotStale") }}
          </v-alert>

          <DashboardActionQueue class="mt-8" :items="dashboardQuery.data.value.actionItems" @open="open" />
          <DashboardMetricGrid class="mt-7" :metrics="dashboardQuery.data.value.metrics" />
          <v-row class="mt-3" dense>
            <v-col cols="12" lg="8">
              <DashboardRecentContent :items="dashboardQuery.data.value.recentContent" @open="open" />
            </v-col>
            <v-col cols="12" lg="4">
              <div class="d-flex flex-column ga-3">
                <DashboardSystemHealth :health="dashboardQuery.data.value.health" :snapshot="dashboardQuery.data.value.snapshot" @open="open" />
                <DashboardQuickActions v-if="quickActions.length > 0" :actions="quickActions" @open="open" />
              </div>
            </v-col>
          </v-row>
        </template>
      </AdminDataState>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page { max-width: 1540px; margin: 0 auto; }
</style>
