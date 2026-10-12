import { VueQueryPlugin } from "@tanstack/vue-query";
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

window.addEventListener(adminSessionClearedEventName, () => {
  authStore.clearSession();
  if (router.currentRoute.value.meta.requiresAuth) {
    void router.replace("/login");
  }
});

app
  .use(pinia)
  .use(VueQueryPlugin)
  .use(router)
  .use(vuetify)
  .mount("#app");
