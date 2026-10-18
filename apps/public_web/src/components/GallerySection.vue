<script setup lang="ts">
import type { PublicLandingGallerySection } from "@mbc/api-contracts";
import { motion } from "motion-v";

defineProps<{ gallery: PublicLandingGallerySection }>();
</script>

<template>
  <section v-if="gallery.items.length" id="gallery" class="section gallery-section">
    <div class="gallery-heading">
      <p class="eyebrow">{{ gallery.eyebrow }}</p>
      <h2>{{ gallery.title }}</h2>
      <p>{{ gallery.body }}</p>
    </div>
    <div class="gallery-grid">
      <motion.figure
        v-for="(item, index) in gallery.items"
        :key="item.id"
        class="gallery-item"
        :class="{ 'gallery-item--wide': index % 5 === 0 }"
        :initial="{ opacity: 0, y: 24, scale: 0.98 }"
        :whileInView="{ opacity: 1, y: 0, scale: 1 }"
        :inViewOptions="{ once: true, margin: '-60px' }"
        :transition="{
          duration: 0.62,
          delay: Math.min(index, 5) * 0.06,
          ease: 'easeOut'
        }"
      >
        <img
          :src="item.imageUrl"
          :alt="item.altText || item.title"
          loading="lazy"
          decoding="async"
        />
        <figcaption v-if="item.title || item.body">
          <strong v-if="item.title">{{ item.title }}</strong>
          <span v-if="item.body">{{ item.body }}</span>
        </figcaption>
      </motion.figure>
    </div>
  </section>
</template>
