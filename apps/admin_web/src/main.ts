import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import {
  adminSessionClearedEventName,
  adminSessionRefreshedEventName
} from "./core/auth/auth_storage";
import { useAdminAuthStore } from "./core/auth/auth_store";
import { createAdminQueryCacheGuard } from "./core/query/admin_query_cache";
import { vuetify } from "./plugins/vuetify";
import { router } from "./router";
import "./styles.css";

const pinia = createPinia();
const app = createApp(App);
const authStore = useAdminAuthStore(pinia);
const queryClient = new QueryClient();
const updateQueryCacheSession = createAdminQueryCacheGuard(
  authStore.accessToken,
  () => queryClient.clear()
);

authStore.$subscribe(
  (_mutation, state) => {
    updateQueryCacheSession(state.accessToken);
  },
  { detached: true }
);

window.addEventListener(adminSessionClearedEventName, () => {
  queryClient.clear();
  authStore.clearSession();
  if (router.currentRoute.value.meta.requiresAuth) {
    void router.replace("/login");
  }
});

window.addEventListener(adminSessionRefreshedEventName, () => {
  authStore.syncStoredSession();
});

app
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .use(vuetify)
  .mount("#app");
