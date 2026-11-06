<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow: string;
    title: string;
    body?: string;
    narrow?: boolean;
    variant?: "section" | "gallery";
  }>(),
  {
    body: "",
    narrow: false,
    variant: "section"
  }
);
</script>

<template>
  <div
    :class="[
      variant === 'gallery' ? 'gallery-heading' : 'section-heading',
      { narrow }
    ]"
  >
    <p class="eyebrow">{{ eyebrow }}</p>
    <h2>{{ title }}</h2>
    <p v-if="body">{{ body }}</p>
  </div>
</template>
