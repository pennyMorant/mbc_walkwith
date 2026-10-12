<script setup lang="ts">
import type { AdminPermission } from "@mbc/api-contracts";
import { useMutation } from "@tanstack/vue-query";
import { computed } from "vue";
import { reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { changeAdminPassword, logoutAdmin } from "@/core/api/auth";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const router = useRouter();
const route = useRoute();
const authStore = useAdminAuthStore();
const { locale, localeOptions, setLocale, t } = useI18n();
const { mobile } = useDisplay();
const navigationDrawer = ref(false);
const passwordDialog = ref(false);
const passwordForm = reactive({
  currentPassword: "",
  newPassword: ""
});

const items: Array<{
  titleKey:
    | "nav.dashboard"
    | "nav.sermons"
    | "nav.sermonGuides"
    | "nav.bibleKnowledge"
    | "nav.bibleNotes"
    | "nav.readingPlans"
    | "nav.discipleship"
    | "nav.lifePosts"
    | "nav.groups"
    | "nav.courses"
    | "nav.serving"
    | "nav.prayer"
    | "nav.giving"
    | "nav.members"
    | "nav.newcomers"
    | "nav.care"
    | "nav.users"
    | "nav.audit"
    | "nav.ai"
    | "nav.notifications"
    | "nav.jobs"
    | "nav.settings";
  value: string;
  permission: AdminPermission;
}> = [
  { titleKey: "nav.dashboard", value: "/", permission: "dashboard:read" },
  { titleKey: "nav.sermons", value: "/sermons", permission: "sermons:read" },
  {
    titleKey: "nav.sermonGuides",
    value: "/sermon-discussion-guides",
    permission: "sermon_guides:read"
  },
  {
    titleKey: "nav.bibleKnowledge",
    value: "/bible-knowledge",
    permission: "bible_knowledge:read"
  },
  {
    titleKey: "nav.bibleNotes",
    value: "/bible-notes",
    permission: "bible_notes:read"
  },
  {
    titleKey: "nav.readingPlans",
    value: "/reading-plans",
    permission: "reading_plans:read"
  },
  {
    titleKey: "nav.discipleship",
    value: "/discipleship",
    permission: "discipleship:read"
  },
  { titleKey: "nav.lifePosts", value: "/life-posts", permission: "life_posts:read" },
  { titleKey: "nav.prayer", value: "/prayer", permission: "prayer:read" },
  { titleKey: "nav.giving", value: "/giving", permission: "giving:read" },
  { titleKey: "nav.groups", value: "/groups", permission: "groups:read" },
  { titleKey: "nav.courses", value: "/courses", permission: "courses:read" },
  { titleKey: "nav.serving", value: "/serving", permission: "serving:read" },
  { titleKey: "nav.members", value: "/members", permission: "users:read" },
  {
    titleKey: "nav.newcomers",
    value: "/newcomers",
    permission: "newcomers:read"
  },
  { titleKey: "nav.care", value: "/care", permission: "care:read" },
  { titleKey: "nav.users", value: "/users", permission: "users:read" },
  { titleKey: "nav.ai", value: "/ai", permission: "ai:read" },
  { titleKey: "nav.audit", value: "/audit", permission: "audit:read" },
  {
    titleKey: "nav.notifications",
    value: "/notifications",
    permission: "notifications:read"
  },
  { titleKey: "nav.jobs", value: "/jobs", permission: "jobs:read" },
  { titleKey: "nav.settings", value: "/settings", permission: "settings:read" }
];

const visibleItems = computed(() =>
  items.filter((item) => authStore.can(item.permission))
);

const currentTitle = computed(() => {
  const active = visibleItems.value.find((item) => item.value === route.path);
  return active ? t(active.titleKey) : t("app.console");
});

watch(
  mobile,
  (isMobile) => {
    navigationDrawer.value = !isMobile;
  },
  { immediate: true }
);

async function navigateTo(path: string) {
  await router.push(path);
  if (mobile.value) {
    navigationDrawer.value = false;
  }
}

async function logout() {
  try {
    await logoutAdmin(null);
  } catch {
    // Local session clearing must still happen if the server session is already gone.
  }
  authStore.clearSession();
  await router.replace("/login");
}

const changePasswordMutation = useMutation({
  mutationFn: () =>
    changeAdminPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    }),
  onSuccess: async () => {
    passwordDialog.value = false;
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    authStore.clearSession();
    await router.replace("/login");
  }
});
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="navigationDrawer"
      :permanent="!mobile"
      :temporary="mobile"
      :width="mobile ? 300 : 260"
    >
      <div class="pa-5">
        <div class="text-h6 font-weight-bold">{{ t("app.brand") }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ t("app.console") }}
        </div>
      </div>
      <v-list nav density="comfortable" class="px-2">
        <v-list-item
          v-for="item in visibleItems"
          :key="item.value"
          :title="t(item.titleKey)"
          :active="route.path === item.value"
          rounded="lg"
          @click="navigateTo(item.value)"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat color="surface">
      <template #prepend>
        <v-app-bar-nav-icon
          v-if="mobile"
          :aria-label="t('Open navigation')"
          @click="navigationDrawer = !navigationDrawer"
        />
      </template>
      <v-app-bar-title class="font-weight-bold text-truncate">
        {{ currentTitle }}
      </v-app-bar-title>
      <template #append>
        <div class="d-flex align-center ga-2 ga-sm-3 pr-1 pr-sm-3">
          <div class="text-right d-none d-sm-block">
            <div class="text-body-2 font-weight-bold">
              {{ authStore.user?.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ authStore.user?.role ? t(authStore.user.role) : "" }}
            </div>
          </div>
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-translate"
                variant="tonal"
                color="primary"
                :aria-label="t('Change language')"
              />
            </template>
            <v-list density="compact" min-width="150">
              <v-list-item
                v-for="option in localeOptions"
                :key="option.value"
                :title="option.title"
                :active="locale === option.value"
                @click="setLocale(option.value)"
              />
            </v-list>
          </v-menu>
          <v-btn
            icon="mdi-lock-reset"
            variant="tonal"
            color="primary"
            :aria-label="t('auth.changePassword')"
            @click="passwordDialog = true"
          />
          <v-btn
            icon="mdi-logout"
            variant="tonal"
            color="primary"
            :aria-label="t('auth.logout')"
            @click="logout"
          />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-3 pa-sm-6 pa-lg-8">
        <slot />
      </v-container>
    </v-main>

    <v-dialog v-model="passwordDialog" max-width="420">
      <v-card class="pa-5">
        <div class="text-h6 font-weight-bold">
          {{ t("auth.changePassword") }}
        </div>
        <v-form
          class="mt-5"
          @submit.prevent="changePasswordMutation.mutate()"
        >
          <v-text-field
            v-model="passwordForm.currentPassword"
            :label="t('auth.currentPassword')"
            type="password"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="passwordForm.newPassword"
            :label="t('auth.newPassword')"
            type="password"
            density="comfortable"
            variant="outlined"
          />
          <v-alert
            v-if="changePasswordMutation.error.value"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{
              formatApiErrorMessage(
                changePasswordMutation.error.value,
                t("common.error")
              )
            }}
          </v-alert>
          <div class="d-flex justify-end ga-3">
            <v-btn variant="text" @click="passwordDialog = false">
              {{ t("common.cancel") }}
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="changePasswordMutation.isPending.value"
              :disabled="
                passwordForm.currentPassword.length === 0 ||
                passwordForm.newPassword.length < 8
              "
            >
              {{ t("common.save") }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </v-app>
</template>
