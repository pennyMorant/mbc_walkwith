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
const emailTouched = ref(false);
const passwordVisible = ref(false);

const normalizedEmail = computed(() => email.value.trim());
const emailValid = computed(() =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail.value)
);
const canSubmit = computed(
  () => emailValid.value && password.value.length > 0
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

function submit() {
  emailTouched.value = true;
  if (canSubmit.value && !loginMutation.isPending.value) {
    loginMutation.mutate();
  }
}
</script>

<template>
  <v-app>
    <v-main class="login-main">
      <div class="login-shell">
        <v-card class="login-card">
          <div class="login-brand">
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" variant="tonal" rounded="lg" size="44">
                <v-icon icon="mdi-church" size="24" />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ t("app.brand") }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ t("auth.subtitle") }}
                </div>
              </div>
            </div>
            <v-select
              :model-value="locale"
              :items="localeOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="locale-select"
              :aria-label="t('Change language')"
              @update:model-value="setLocale"
            />
          </div>

          <div class="mt-8">
            <h1 class="text-h5 font-weight-bold">{{ t("auth.welcomeTitle") }}</h1>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
              {{ t("auth.welcomeBody") }}
            </p>
          </div>

          <v-form
            class="mt-6"
            @submit.prevent="submit"
          >
            <v-text-field
              v-model="email"
              :label="t('auth.email')"
              type="email"
              autocomplete="username"
              variant="outlined"
              density="comfortable"
              :error-messages="emailTouched && !emailValid ? [t('auth.invalidEmail')] : []"
              :disabled="loginMutation.isPending.value"
              @blur="emailTouched = true"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.password')"
              :type="passwordVisible ? 'text' : 'password'"
              autocomplete="current-password"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              :disabled="loginMutation.isPending.value"
            />

            <v-checkbox
              v-model="passwordVisible"
              :label="t('auth.showPassword')"
              density="compact"
              hide-details
              class="mt-n2"
              :disabled="loginMutation.isPending.value"
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
  background: rgb(var(--v-theme-background));
}

.login-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(100%, 440px);
  padding: 32px;
  box-shadow: 0 18px 56px rgba(25, 28, 26, 0.08) !important;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.locale-select {
  width: 120px;
  flex: 0 0 120px;
}

@media (max-width: 420px) {
  .login-shell {
    align-items: start;
    padding: 16px;
  }

  .login-card {
    margin-top: 24px;
    padding: 24px;
  }

  .login-brand {
    align-items: stretch;
    flex-direction: column;
  }

  .locale-select {
    width: 100%;
    flex-basis: auto;
  }
}
</style>
