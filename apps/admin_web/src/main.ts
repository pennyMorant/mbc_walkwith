import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import {
  adminSessionClearedEventName,
  adminSessionRefreshedEventName,
  isAdminSessionStorageKey
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
let storedSessionSyncTimer: ReturnType<typeof setTimeout> | null = null;

authStore.$subscribe(
  (_mutation, state) => {
    updateQueryCacheSession(state.accessToken);
  },
  { detached: true }
);

window.addEventListener(adminSessionClearedEventName, () => {
  queryClient.clear();
  authStore.clearSession();
  reconcileAdminSessionRoute();
});

window.addEventListener(adminSessionRefreshedEventName, () => {
  syncAdminSessionFromStorage();
});

window.addEventListener("storage", (event) => {
  if (
    !isAdminSessionStorageKey(event.key) ||
    (event.storageArea && event.storageArea !== localStorage)
  ) {
    return;
  }
  if (storedSessionSyncTimer) clearTimeout(storedSessionSyncTimer);
  storedSessionSyncTimer = setTimeout(() => {
    storedSessionSyncTimer = null;
    syncAdminSessionFromStorage();
  }, 0);
});

function syncAdminSessionFromStorage() {
  authStore.syncStoredSession();
  reconcileAdminSessionRoute();
}

function reconcileAdminSessionRoute() {
  const currentRoute = router.currentRoute.value;
  void router.replace({
    path: currentRoute.path,
    query: currentRoute.query,
    hash: currentRoute.hash,
    force: true
  });
}

app
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .use(vuetify)
  .mount("#app");
