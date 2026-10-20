<script setup lang="ts">
import { useMutation } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { changeAdminPassword, logoutAdmin } from "@/core/api/auth";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminCommandSearch from "@/core/navigation/AdminCommandSearch.vue";
import { adminNavigationGroups } from "@/core/navigation/admin_navigation";

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

const visibleGroups = computed(() =>
  adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => authStore.can(item.permission))
    }))
    .filter((group) => group.items.length > 0)
);

const visibleItems = computed(() => visibleGroups.value.flatMap((group) => group.items));

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
      <div class="admin-brand pa-5 d-flex align-center ga-3">
        <div class="admin-brand__mark d-flex align-center justify-center">
          <v-icon icon="mdi-leaf" size="24" />
        </div>
        <div>
          <div class="text-h6 font-weight-bold">{{ t("app.brand") }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ t("app.console") }}
          </div>
        </div>
      </div>
      <div v-if="mobile" class="px-4 pb-4">
        <AdminCommandSearch
          fluid
          :items="visibleItems"
          @navigate="navigateTo"
        />
      </div>
      <div class="admin-navigation px-2 pb-5">
        <section v-for="group in visibleGroups" :key="group.id" class="admin-navigation__group">
          <div v-if="group.titleKey" class="admin-navigation__label px-3 mb-1">
            {{ t(group.titleKey) }}
          </div>
          <v-list nav density="compact" class="pa-0">
            <v-list-item
              v-for="item in group.items"
              :key="item.value"
              :title="t(item.titleKey)"
              :prepend-icon="item.icon"
              :active="route.path === item.value"
              rounded="lg"
              @click="navigateTo(item.value)"
            />
          </v-list>
        </section>
      </div>
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
      <AdminCommandSearch
        v-if="!mobile"
        :items="visibleItems"
        @navigate="navigateTo"
      />
      <template #append>
        <div class="d-flex align-center ga-2 ga-sm-3 pr-1 pr-sm-3">
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
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" class="admin-account-button px-2">
                <v-avatar color="primary" size="34">
                  <span class="text-body-2 font-weight-bold">{{ authStore.user?.name?.slice(0, 1) }}</span>
                </v-avatar>
                <div class="text-left d-none d-md-block ml-2">
                  <div class="text-body-2 font-weight-bold">{{ authStore.user?.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ authStore.user?.role ? t(authStore.user.role) : "" }}</div>
                </div>
                <v-icon icon="mdi-chevron-down" size="18" class="ml-1" />
              </v-btn>
            </template>
            <v-list density="compact" min-width="220">
              <v-list-item prepend-icon="mdi-lock-reset" :title="t('auth.changePassword')" @click="passwordDialog = true" />
              <v-divider class="my-1" />
              <v-list-item prepend-icon="mdi-logout" :title="t('auth.logout')" @click="logout" />
            </v-list>
          </v-menu>
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

<style scoped>
.admin-brand {
  min-height: 78px;
}

.admin-brand__mark {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 14px;
  color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary-container));
}

.admin-navigation__group + .admin-navigation__group {
  margin-top: 18px;
}

.admin-navigation__label {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  font-weight: 700;
}

.admin-account-button {
  height: 48px;
}
</style>
