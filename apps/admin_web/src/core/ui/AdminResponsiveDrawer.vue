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
    location="right"
    temporary
    :width="props.desktopWidth"
  >
    <slot />
  </v-navigation-drawer>
</template>

<style scoped>
.admin-responsive-drawer { max-width: 100vw !important; }
</style>
