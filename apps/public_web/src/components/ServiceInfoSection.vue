<script setup lang="ts">
import type { PublicLandingServiceSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

import { actionRel, actionTarget } from "@/core/actions";

defineProps<{
  service: PublicLandingServiceSection;
}>();
</script>

<template>
  <section
    id="service"
    class="section service-section"
    :class="{ 'service-section--text-only': !service.imageUrl.trim() }"
  >
    <motion.div
      v-if="service.imageUrl.trim()"
      class="service-photo"
      :initial="{ opacity: 0, scale: 0.97 }"
      :whileInView="{ opacity: 1, scale: 1 }"
      :inViewOptions="{ once: true, margin: '-80px' }"
      :transition="{ duration: 0.8, ease: 'easeOut' }"
    >
      <img :src="service.imageUrl" :alt="service.title" />
    </motion.div>

    <motion.div
      class="service-panel"
      :initial="{ opacity: 0, y: 28 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :inViewOptions="{ once: true, margin: '-80px' }"
      :transition="{ duration: 0.7, ease: 'easeOut' }"
    >
      <p class="eyebrow">{{ service.eyebrow }}</p>
      <h2>{{ service.title }}</h2>
      <p>{{ service.body }}</p>
      <div class="service-facts">
        <div v-for="fact in service.facts" :key="fact.id">
          <v-icon :icon="fact.iconName" />
          <span>{{ fact.label }}</span>
        </div>
      </div>
      <div class="service-actions">
        <v-btn
          v-for="(action, index) in service.actions"
          :key="action.id"
          :href="action.href"
          :target="actionTarget(action)"
          :rel="actionRel(action)"
          :variant="index === 0 ? 'flat' : 'outlined'"
          color="primary"
        >
          {{ action.title }}
        </v-btn>
      </div>
    </motion.div>
  </section>
</template>
