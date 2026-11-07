<script setup lang="ts">
const open = defineModel<boolean>({ required: true });

const props = withDefaults(defineProps<{ desktopWidth?: number }>(), {
  desktopWidth: 560
});
</script>

<template>
  <v-navigation-drawer
    v-model="open"
    class="admin-responsive-drawer"
    color="surface"
    location="right"
    temporary
    :width="props.desktopWidth"
  >
    <slot />
  </v-navigation-drawer>
</template>

<style scoped>
.admin-responsive-drawer {
  max-width: 100vw !important;
  border-inline-start-color: rgba(var(--v-theme-outline-variant), 0.65) !important;
}

.admin-responsive-drawer :deep(.v-navigation-drawer__content) {
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
</style>
