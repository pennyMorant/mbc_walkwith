import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { adminSessionClearedEventName } from "./core/auth/auth_storage";
import { useAdminAuthStore } from "./core/auth/auth_store";
import { vuetify } from "./plugins/vuetify";
import { router } from "./router";
import "./styles.css";

const pinia = createPinia();
const app = createApp(App);
const authStore = useAdminAuthStore(pinia);
const queryClient = new QueryClient();
let activeAccessToken = authStore.accessToken;

authStore.$subscribe(
  (_mutation, state) => {
    if (state.accessToken === activeAccessToken) return;
    activeAccessToken = state.accessToken;
    queryClient.clear();
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

app
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .use(vuetify)
  .mount("#app");
