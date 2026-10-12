<script setup lang="ts">
import { useMutation } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { loginAdmin } from "@/core/api/auth";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const route = useRoute();
const router = useRouter();
const authStore = useAdminAuthStore();
const { locale, localeOptions, setLocale, t } = useI18n();

const email = ref("");
const password = ref("");

const normalizedEmail = computed(() => email.value.trim());
const canSubmit = computed(
  () => normalizedEmail.value.length > 0 && password.value.length > 0
);
const redirectPath = computed(() => safeInternalRedirect(route.query.redirect));

const loginMutation = useMutation({
  mutationFn: () =>
    loginAdmin({
      email: normalizedEmail.value,
      password: password.value
    }),
  onSuccess: async (session) => {
    authStore.setSession(session);
    await router.replace(redirectPath.value);
  }
});

function safeInternalRedirect(value: unknown) {
  if (typeof value !== "string") {
    return "/";
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
</script>

<template>
  <v-app>
    <v-main class="login-main">
      <div class="login-shell">
        <v-card class="login-card">
          <div class="login-brand">
            <div>
              <div class="text-h5 font-weight-bold">{{ t("app.brand") }}</div>
              <div class="text-body-2 text-medium-emphasis mt-1">
                {{ t("auth.subtitle") }}
              </div>
            </div>
            <div class="d-flex align-center ga-2">
              <v-select
                :model-value="locale"
                :items="localeOptions"
                density="compact"
                variant="outlined"
                hide-details
                class="locale-select"
                @update:model-value="setLocale"
              />
              <v-avatar color="primary" variant="tonal" rounded="lg">
                <v-icon icon="mdi-church" />
              </v-avatar>
            </div>
          </div>

          <v-form
            class="mt-8"
            @submit.prevent="canSubmit && loginMutation.mutate()"
          >
            <v-text-field
              v-model="email"
              :label="t('auth.email')"
              type="email"
              autocomplete="username"
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.password')"
              type="password"
              autocomplete="current-password"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />

            <v-alert
              v-if="loginMutation.error.value"
              type="error"
              variant="tonal"
              class="mt-2"
            >
              {{
                formatApiErrorMessage(
                  loginMutation.error.value,
                  t("common.error")
                )
              }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              class="mt-5"
              :disabled="!canSubmit"
              :loading="loginMutation.isPending.value"
            >
              {{ t("auth.signIn") }}
            </v-btn>
          </v-form>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.login-main {
  background:
    linear-gradient(135deg, rgba(56, 106, 32, 0.12), transparent 42%),
    rgb(var(--v-theme-background));
}

.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(100%, 440px);
  padding: 28px;
  border: 1px solid rgba(86, 98, 76, 0.12);
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.locale-select {
  width: 120px;
}
</style>
