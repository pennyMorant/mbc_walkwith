<script setup lang="ts">
import type {
  PublicLandingHero,
  PublicLandingIdentity
} from "@mbc/api-contracts";
import { motion } from "motion-v";
import { computed } from "vue";

import { actionRel, actionTarget } from "@/core/actions";

const props = defineProps<{
  hero: PublicLandingHero;
  identity: PublicLandingIdentity;
}>();

const missionPhrases = computed(() =>
  props.hero.mission
    .split(/\s*[，,]\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
);

const heroStyle = computed(() => ({
  "--hero-image": props.hero.imageUrl.trim()
    ? `url("${props.hero.imageUrl}")`
    : "none"
}));

function missionInitial(index: number) {
  if (index % 3 === 0) {
    return { opacity: 0, x: -120, y: -44, scale: 0.92 };
  }
  if (index % 3 === 1) {
    return { opacity: 0, x: 0, y: -90, scale: 0.92 };
  }
  return { opacity: 0, x: 120, y: -44, scale: 0.92 };
}
</script>

<template>
  <section id="top" class="hero-section" :style="heroStyle">
    <div class="hero-light-field" aria-hidden="true">
      <span class="hero-cross" />
      <span class="hero-bible-glow" />
    </div>
    <div class="hero-overlay" />
    <div class="hero-content">
      <motion.div
        class="hero-symbol"
        :initial="{ opacity: 0, y: -18, scale: 0.94 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.82, ease: 'easeOut' }"
        aria-hidden="true"
      >
        <span class="hero-symbol-cross" />
        <img :src="identity.logoUrl" alt="" />
        <span class="hero-symbol-bible">
          <i />
          <i />
        </span>
      </motion.div>

      <motion.div
        class="hero-kicker"
        :initial="{ opacity: 0, y: 18 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.7, ease: 'easeOut' }"
      >
        {{ hero.kicker }}
      </motion.div>

      <motion.h1
        :initial="{ opacity: 0, y: 28 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.85, delay: 0.1, ease: 'easeOut' }"
      >
        {{ hero.title }}
      </motion.h1>

      <p class="mission-line">{{ hero.mission }}</p>

      <motion.div
        v-if="missionPhrases.length"
        class="hero-mission-declaration"
        :initial="{ opacity: 0, y: 24 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.85, delay: 0.3, ease: 'easeOut' }"
        aria-hidden="true"
      >
        <motion.span
          v-for="(phrase, index) in missionPhrases"
          :key="phrase"
          :initial="missionInitial(index)"
          :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
          :transition="{
            duration: 0.75,
            delay: 0.42 + index * 0.12,
            ease: 'easeOut'
          }"
        >
          {{ phrase }}
        </motion.span>
      </motion.div>

      <motion.p
        class="hero-copy"
        :initial="{ opacity: 0, y: 24 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.85, delay: 0.34, ease: 'easeOut' }"
      >
        {{ hero.body }}
      </motion.p>

      <motion.div
        class="hero-actions"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.75, delay: 0.45, ease: 'easeOut' }"
      >
        <v-btn
          v-for="(action, index) in hero.primaryActions"
          :key="action.id"
          :href="action.href"
          :target="actionTarget(action)"
          :rel="actionRel(action)"
          size="large"
          :prepend-icon="action.iconName"
          :variant="index === 0 ? 'flat' : 'outlined'"
          :color="index === 0 ? 'primary' : 'white'"
        >
          {{ action.title }}
        </v-btn>
      </motion.div>
    </div>

    <motion.div
      class="hero-quick-actions"
      :initial="{ opacity: 0, y: 30 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.55, ease: 'easeOut' }"
    >
      <a
        v-for="action in hero.quickActions"
        :key="action.href"
        class="quick-action"
        :href="action.href"
        :target="actionTarget(action)"
        :rel="actionRel(action)"
      >
        <v-icon :icon="action.iconName" />
        <span>
          <strong>{{ action.title }}</strong>
          <small>{{ action.subtitle }}</small>
        </span>
      </a>
    </motion.div>
  </section>
</template>
