<script setup lang="ts">
import type { AdminPermission } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { getAdminDashboard } from "@/core/api/dashboard";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatDashboardMetricValue,
  formatDashboardTimestamp
} from "../dashboard_presenters";

const router = useRouter();
const authStore = useAdminAuthStore();
const { locale, t } = useI18n();

const dashboardQuery = useQuery({
  queryKey: ["admin-dashboard"],
  queryFn: getAdminDashboard
});

const workspaceItems: Array<{
  titleKey: string;
  bodyKey: string;
  path: string;
  permission: AdminPermission;
  icon: string;
}> = [
  {
    titleKey: "nav.lifePosts",
    bodyKey: "dashboard.workspace.lifePosts",
    path: "/life-posts",
    permission: "life_posts:read",
    icon: "mdi-newspaper-variant-outline"
  },
  {
    titleKey: "nav.groups",
    bodyKey: "dashboard.workspace.groups",
    path: "/groups",
    permission: "groups:read",
    icon: "mdi-account-group-outline"
  },
  {
    titleKey: "nav.courses",
    bodyKey: "dashboard.workspace.courses",
    path: "/courses",
    permission: "courses:read",
    icon: "mdi-school-outline"
  },
  {
    titleKey: "nav.readingPlans",
    bodyKey: "dashboard.workspace.readingPlans",
    path: "/reading-plans",
    permission: "reading_plans:read",
    icon: "mdi-book-open-page-variant-outline"
  },
  {
    titleKey: "nav.sermonGuides",
    bodyKey: "dashboard.workspace.sermonGuides",
    path: "/sermon-discussion-guides",
    permission: "sermon_guides:read",
    icon: "mdi-forum-outline"
  },
  {
    titleKey: "nav.discipleship",
    bodyKey: "dashboard.workspace.discipleship",
    path: "/discipleship",
    permission: "discipleship:read",
    icon: "mdi-map-check-outline"
  },
  {
    titleKey: "nav.serving",
    bodyKey: "dashboard.workspace.serving",
    path: "/serving",
    permission: "serving:read",
    icon: "mdi-calendar-check-outline"
  },
  {
    titleKey: "nav.care",
    bodyKey: "dashboard.workspace.care",
    path: "/care",
    permission: "care:read",
    icon: "mdi-hand-heart-outline"
  },
  {
    titleKey: "nav.newcomers",
    bodyKey: "dashboard.workspace.newcomers",
    path: "/newcomers",
    permission: "newcomers:read",
    icon: "mdi-account-heart-outline"
  },
  {
    titleKey: "nav.giving",
    bodyKey: "dashboard.workspace.giving",
    path: "/giving",
    permission: "giving:read",
    icon: "mdi-hand-coin-outline"
  }
];

const visibleWorkspaceItems = computed(() =>
  workspaceItems.filter((item) => authStore.can(item.permission))
);

const focusItems: Array<{ labelKey: string; permission: AdminPermission }> = [
  { labelKey: "dashboard.focus.jobs", permission: "jobs:read" },
  { labelKey: "dashboard.focus.sermons", permission: "sermons:read" },
  { labelKey: "dashboard.focus.prayer", permission: "prayer:read" },
  { labelKey: "dashboard.focus.failures", permission: "jobs:read" }
];

const visibleFocusItems = computed(() =>
  focusItems.filter((item) => authStore.can(item.permission))
);

function toneColor(tone: string) {
  return {
    primary: "primary",
    secondary: "secondary",
    warning: "warning",
    info: "info",
    success: "success",
    error: "error"
  }[tone] ?? "primary";
}

function metricValue(metric: Parameters<typeof formatDashboardMetricValue>[0]) {
  return formatDashboardMetricValue(metric, locale.value);
}

function snapshotTime(value: string) {
  return formatDashboardTimestamp(value, locale.value);
}

async function openWorkspace(path: string) {
  await router.push(path);
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.dashboard") }}</div>
        <div class="page-subtitle">
          {{ t("dashboard.subtitle") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-refresh"
        :loading="dashboardQuery.isFetching.value"
        @click="dashboardQuery.refetch()"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <v-progress-linear
      v-if="dashboardQuery.isPending.value && !dashboardQuery.data.value"
      indeterminate
      color="primary"
      class="mt-6"
    />

    <v-alert
      v-if="dashboardQuery.error.value && !dashboardQuery.data.value"
      type="error"
      variant="tonal"
      class="mt-6"
    >
      {{ formatApiErrorMessage(dashboardQuery.error.value, t("common.error")) }}
    </v-alert>

    <template v-if="dashboardQuery.data.value">
      <v-alert
        v-if="dashboardQuery.error.value"
        type="error"
        variant="tonal"
        class="mt-6"
      >
        {{ formatApiErrorMessage(dashboardQuery.error.value, t("common.error")) }}
      </v-alert>

      <v-alert
        v-if="dashboardQuery.data.value.snapshot.status === 'stale'"
        type="warning"
        variant="tonal"
        class="mt-6"
      >
        {{ t("dashboard.snapshotStale") }}
      </v-alert>

      <div class="d-flex align-center ga-2 mt-6">
        <v-chip
          size="small"
          variant="tonal"
          :color="
            dashboardQuery.data.value.snapshot.status === 'fresh'
              ? 'success'
              : 'warning'
          "
        >
          {{
            t(
              dashboardQuery.data.value.snapshot.status === "fresh"
                ? "dashboard.snapshotFresh"
                : "dashboard.snapshotStaleLabel"
            )
          }}
        </v-chip>
        <span class="text-caption text-medium-emphasis">
          {{ t("dashboard.lastUpdated") }}
          {{ snapshotTime(dashboardQuery.data.value.snapshot.generatedAt) }}
        </span>
      </div>

      <v-row class="mt-6" dense>
        <v-col
          v-for="metric in dashboardQuery.data.value.metrics"
          :key="metric.id"
          cols="12"
          md="4"
          lg="2"
        >
          <v-card
            class="pa-5 h-100"
            :to="metric.path ?? undefined"
          >
            <div class="d-flex align-center justify-space-between">
              <div class="text-body-2 text-medium-emphasis">
                {{ t(metric.labelKey) }}
              </div>
              <v-chip size="x-small" :color="toneColor(metric.tone)" />
            </div>
            <div
              :class="[
                metric.format === 'currency' ? 'text-h5' : 'text-h4',
                'font-weight-bold mt-2'
              ]"
            >
              {{ metricValue(metric) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2" dense>
        <v-col cols="12">
          <v-card class="pa-5" variant="outlined">
            <div class="d-flex align-center justify-space-between ga-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ t("dashboard.workspace.title") }}
                </div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  {{ t("dashboard.workspace.subtitle") }}
                </div>
              </div>
            </div>
            <v-row class="mt-3" dense>
              <v-col
                v-for="item in visibleWorkspaceItems"
                :key="item.path"
                cols="12"
                sm="6"
                lg="4"
              >
                <v-card
                  class="pa-4 h-100 workspace-card"
                  variant="tonal"
                  @click="openWorkspace(item.path)"
                >
                  <div class="d-flex align-start ga-3">
                    <v-icon :icon="item.icon" color="primary" />
                    <div>
                      <div class="font-weight-bold">{{ t(item.titleKey) }}</div>
                      <div class="text-body-2 text-medium-emphasis mt-1">
                        {{ t(item.bodyKey) }}
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <v-col v-if="dashboardQuery.data.value.jobs" cols="12" md="6">
          <v-card class="pa-5 h-100">
            <div class="text-subtitle-1 font-weight-bold">
              {{ t("Job health") }}
            </div>
            <v-divider class="my-4" />
            <v-list density="compact" class="pa-0">
              <v-list-item
                :title="t('Queued')"
                :subtitle="`${dashboardQuery.data.value.jobs?.queued ?? 0} ${t('dashboard.jobSubtitle.waiting')}`"
              />
              <v-list-item
                :title="t('Running')"
                :subtitle="`${dashboardQuery.data.value.jobs?.running ?? 0} ${t('dashboard.jobSubtitle.active')}`"
              />
              <v-list-item
                :title="t('Failed')"
                :subtitle="`${dashboardQuery.data.value.jobs?.failed ?? 0} ${t('dashboard.jobSubtitle.failed')}`"
              />
            </v-list>
          </v-card>
        </v-col>
        <v-col
          v-if="visibleFocusItems.length > 0"
          cols="12"
          :md="dashboardQuery.data.value.jobs ? 6 : 12"
        >
          <v-card class="pa-5 h-100">
            <div class="text-subtitle-1 font-weight-bold">
              {{ t("Operational focus") }}
            </div>
            <v-divider class="my-4" />
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="item in visibleFocusItems"
                :key="item.labelKey"
                :title="t(item.labelKey)"
              />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <div
        v-if="dashboardQuery.data.value.snapshot.status === 'stale'"
        class="text-caption text-medium-emphasis mt-3"
      >
        {{ t("dashboard.lastAttempted") }}
        {{ snapshotTime(dashboardQuery.data.value.snapshot.attemptedAt) }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.workspace-card {
  cursor: pointer;
}
</style>
