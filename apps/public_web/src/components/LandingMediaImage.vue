<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    alt: string;
    fallbackIcon?: string;
    loading?: "eager" | "lazy";
    src: string | null;
  }>(),
  {
    fallbackIcon: "mdi-image-outline",
    loading: "lazy"
  }
);

const failed = ref(false);

watch(
  () => props.src,
  () => {
    failed.value = false;
  }
);
</script>

<template>
  <img
    v-if="src && !failed"
    class="landing-media-image"
    :src="src"
    :alt="alt"
    :loading="loading"
    decoding="async"
    @error="failed = true"
  />
  <div
    v-else
    class="landing-media-fallback"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
  >
    <v-icon :icon="fallbackIcon" size="42" />
  </div>
</template>

<style scoped>
.landing-media-image,
.landing-media-fallback {
  width: 100%;
  height: 100%;
}

.landing-media-image {
  display: block;
  object-fit: cover;
}

.landing-media-fallback {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 28%, rgba(246, 223, 159, 0.14), transparent 44%),
    rgba(49, 95, 69, 0.24);
  color: rgba(246, 223, 159, 0.78);
}
</style>
