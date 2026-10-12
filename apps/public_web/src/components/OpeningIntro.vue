<script setup lang="ts">
import type {
  PublicLandingHero,
  PublicLandingIdentity
} from "@mbc/api-contracts";
import { motion } from "motion-v";
import { computed, onBeforeUnmount, onMounted } from "vue";

const props = defineProps<{
  hero: PublicLandingHero;
  identity: PublicLandingIdentity;
}>();

const emit = defineEmits<{
  complete: [];
}>();

let timer: number | undefined;
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const missionPhrases = computed(() => {
  const phrases = props.hero.mission
    .split(/\s*[，,]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  return phrases.length >= 2 ? phrases : [props.hero.mission];
});

const introStyle = computed(() => ({
  "--intro-image": props.hero.imageUrl.trim()
    ? `url("${props.hero.imageUrl}")`
    : "none"
}));

onMounted(() => {
  timer = window.setTimeout(() => emit("complete"), reduceMotion ? 1800 : 4860);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearTimeout(timer);
  }
});

type MotionState = Record<string, number | string>;

function introInitial<T extends MotionState>(initial: T, visible: T) {
  return reduceMotion ? visible : initial;
}

function introTransition(duration: number, delay: number) {
  return {
    duration: reduceMotion ? 0.01 : duration,
    delay: reduceMotion ? 0 : delay,
    ease: "easeOut" as const
  };
}

function missionInitial(index: number) {
  const visible = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0
  };
  if (reduceMotion) {
    return visible;
  }
  if (index % 3 === 0) {
    return { opacity: 0, x: -280, y: -120, scale: 0.82, rotate: -5 };
  }
  if (index % 3 === 1) {
    return { opacity: 0, x: 0, y: -190, scale: 0.86, rotate: 0 };
  }
  return { opacity: 0, x: 280, y: -120, scale: 0.82, rotate: 5 };
}

function missionTransition(index: number) {
  return introTransition(1.05, 1.84 + index * 0.22);
}
</script>

<template>
  <motion.section
    class="opening-intro"
    :style="introStyle"
    :initial="{ opacity: 1 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    aria-live="polite"
  >
    <motion.div
      class="opening-veil"
      :initial="introInitial({ opacity: 0.95 }, { opacity: 0.38 })"
      :animate="{ opacity: 0.38 }"
      :transition="introTransition(1.5, 0)"
    />
    <motion.div
      class="opening-light"
      :initial="
        introInitial(
          { opacity: 0, scaleY: 0.58, x: -90 },
          { opacity: 1, scaleY: 1, x: 0 }
        )
      "
      :animate="{ opacity: 1, scaleY: 1, x: 0 }"
      :transition="introTransition(1.35, 0.35)"
      aria-hidden="true"
    />
    <motion.div
      class="opening-symbol"
      :initial="
        introInitial(
          { opacity: 0, y: 20, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1 }
        )
      "
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :transition="introTransition(0.95, 0.75)"
    >
      <span class="opening-cross" aria-hidden="true" />
      <img :src="identity.logoUrl" :alt="identity.name" />
      <span class="opening-bible" aria-hidden="true">
        <i />
        <i />
      </span>
    </motion.div>

    <div class="opening-copy">
      <motion.p
        class="opening-kicker"
        :initial="introInitial({ opacity: 0, y: 16 }, { opacity: 1, y: 0 })"
        :animate="{ opacity: 1, y: 0 }"
        :transition="introTransition(0.75, 1.25)"
      >
        {{ identity.englishName }}
      </motion.p>
      <motion.h1
        :initial="introInitial({ opacity: 0, y: 20 }, { opacity: 1, y: 0 })"
        :animate="{ opacity: 1, y: 0 }"
        :transition="introTransition(0.8, 1.48)"
      >
        {{ identity.name }}
      </motion.h1>
      <div class="opening-mission">
        <motion.div
          class="opening-mission-center-glow"
          :initial="introInitial({ opacity: 0, scale: 0.42 }, { opacity: 1, scale: 1 })"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="introTransition(0.8, 2.75)"
          aria-hidden="true"
        />
        <motion.span
          v-for="(phrase, index) in missionPhrases"
          :key="phrase"
          :class="`mission-vector-${index + 1}`"
          :initial="missionInitial(index)"
          :animate="{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }"
          :transition="missionTransition(index)"
        >
          {{ phrase }}
        </motion.span>
      </div>
      <motion.p
        class="opening-welcome"
        :initial="introInitial({ opacity: 0, y: 14 }, { opacity: 1, y: 0 })"
        :animate="{ opacity: 1, y: 0 }"
        :transition="introTransition(0.78, 3.15)"
      >
        {{ identity.welcome }}
      </motion.p>
    </div>
  </motion.section>
</template>
