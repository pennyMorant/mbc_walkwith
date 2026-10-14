<script setup lang="ts">
import type { PublicLandingScheduleSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

defineProps<{
  schedule: PublicLandingScheduleSection;
}>();
</script>

<template>
  <section v-if="schedule.items.length" id="schedule" class="section schedule-section">
    <div class="section-heading narrow">
      <p class="eyebrow">{{ schedule.eyebrow }}</p>
      <h2>{{ schedule.title }}</h2>
      <p>{{ schedule.body }}</p>
    </div>

    <div class="schedule-grid">
      <motion.article
        v-for="(item, index) in schedule.items"
        :key="item.id"
        class="schedule-card"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :inViewOptions="{ once: true, margin: '-60px' }"
        :transition="{ duration: 0.55, delay: index * 0.06, ease: 'easeOut' }"
      >
        <div class="schedule-icon"><v-icon :icon="item.iconName" /></div>
        <div>
          <h3>{{ item.title }}</h3>
          <p class="schedule-time">{{ item.dayLabel }} · {{ item.timeLabel }}</p>
          <p v-if="item.location" class="schedule-location">{{ item.location }}</p>
          <p v-if="item.detail" class="schedule-detail">{{ item.detail }}</p>
        </div>
      </motion.article>
    </div>
  </section>
</template>
