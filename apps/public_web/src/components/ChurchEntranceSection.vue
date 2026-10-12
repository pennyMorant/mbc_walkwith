<script setup lang="ts">
import type { PublicLandingEntranceSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

import { actionRel, actionTarget } from "@/core/actions";

defineProps<{
  entrance: PublicLandingEntranceSection;
}>();
</script>

<template>
  <section id="new" class="section entrance-section">
    <div class="section-heading narrow">
      <p class="eyebrow">{{ entrance.eyebrow }}</p>
      <h2>{{ entrance.title }}</h2>
      <p>{{ entrance.body }}</p>
    </div>

    <div class="entrance-grid">
      <motion.a
        v-for="(action, index) in entrance.actions"
        :key="action.id"
        class="entrance-card"
        :href="action.href"
        :target="actionTarget(action)"
        :rel="actionRel(action)"
        :initial="{ opacity: 0, y: 30 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :inViewOptions="{ once: true, margin: '-70px' }"
        :transition="{ duration: 0.62, delay: index * 0.08, ease: 'easeOut' }"
      >
        <div class="icon-box">
          <v-icon :icon="action.iconName" />
        </div>
        <h3>{{ action.title }}</h3>
        <p>{{ action.subtitle }}</p>
      </motion.a>
    </div>
  </section>
</template>
