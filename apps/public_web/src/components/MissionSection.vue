<script setup lang="ts">
import type { PublicLandingMissionSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

defineProps<{
  mission: PublicLandingMissionSection;
}>();
</script>

<template>
  <section id="mission" class="section mission-section">
    <div class="section-heading">
      <p class="eyebrow">{{ mission.eyebrow }}</p>
      <h2>{{ mission.title }}</h2>
      <p>{{ mission.body }}</p>
    </div>

    <div class="mission-grid">
      <motion.article
        v-for="(pillar, index) in mission.pillars"
        :key="pillar.title"
        class="mission-card"
        :initial="{ opacity: 0, y: 32 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :inViewOptions="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.65, delay: index * 0.08, ease: 'easeOut' }"
      >
        <div class="icon-box">
          <v-icon :icon="pillar.iconName" />
        </div>
        <h3>{{ pillar.title }}</h3>
        <p>{{ pillar.body }}</p>
      </motion.article>
    </div>
  </section>
</template>
