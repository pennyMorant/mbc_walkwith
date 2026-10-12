<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AdminShell from "./layouts/AdminShell.vue";

const route = useRoute();
const usesAuthLayout = computed(() => route.meta.layout === "auth");
</script>

<template>
  <router-view v-if="usesAuthLayout" />
  <AdminShell v-else>
    <router-view />
  </AdminShell>
</template>
