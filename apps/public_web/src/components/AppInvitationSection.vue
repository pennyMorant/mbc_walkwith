<script setup lang="ts">
import type { PublicLandingAppSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

import { actionRel, actionTarget } from "@/core/actions";

defineProps<{
  app: PublicLandingAppSection;
}>();
</script>

<template>
  <section id="app" class="section app-section">
    <motion.div
      class="phone-preview"
      :initial="{ opacity: 0, rotate: -2, y: 28 }"
      :whileInView="{ opacity: 1, rotate: 0, y: 0 }"
      :inViewOptions="{ once: true, margin: '-80px' }"
      :transition="{ duration: 0.8, ease: 'easeOut' }"
    >
      <div class="phone-shell">
        <div class="phone-header">{{ app.previewTitle }}</div>
        <div
          v-for="(item, index) in app.previewItems"
          :key="item"
          class="phone-card"
          :class="{ active: index === 0 }"
        >
          {{ item }}
        </div>
      </div>
    </motion.div>

    <div class="app-copy">
      <p class="eyebrow">{{ app.eyebrow }}</p>
      <h2>{{ app.title }}</h2>
      <p>{{ app.body }}</p>
      <div class="highlight-grid">
        <motion.div
          v-for="(item, index) in app.highlights"
          :key="item.title"
          class="highlight-item"
          :initial="{ opacity: 0, y: 24 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :inViewOptions="{ once: true, margin: '-60px' }"
          :transition="{ duration: 0.55, delay: index * 0.06, ease: 'easeOut' }"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </motion.div>
      </div>
      <div class="app-actions">
        <v-btn
          v-for="action in app.actions"
          :key="action.id"
          :href="action.href"
          :target="actionTarget(action)"
          :rel="actionRel(action)"
          color="primary"
        >
          {{ action.title }}
        </v-btn>
      </div>
    </div>
  </section>
</template>
