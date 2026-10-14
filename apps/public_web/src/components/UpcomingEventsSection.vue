<script setup lang="ts">
import type {
  PublicLandingEvent,
  PublicLandingEventsSection,
  SupportedLocale
} from "@mbc/api-contracts";
import { motion } from "motion-v";

const props = defineProps<{
  events: PublicLandingEventsSection;
  locale: SupportedLocale;
}>();

const dateLocales: Record<SupportedLocale, string> = {
  en: "en-US",
  es: "es-US",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW"
};

function eventDate(event: PublicLandingEvent) {
  if (!event.startsAt) return "";
  return new Intl.DateTimeFormat(dateLocales[props.locale], {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(event.startsAt));
}
</script>

<template>
  <section v-if="events.items.length" id="events" class="section events-section">
    <div class="section-heading">
      <p class="eyebrow">{{ events.eyebrow }}</p>
      <h2>{{ events.title }}</h2>
      <p>{{ events.body }}</p>
    </div>

    <div class="events-grid">
      <motion.article
        v-for="(event, index) in events.items"
        :key="event.id"
        class="event-card"
        :initial="{ opacity: 0, y: 28 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :inViewOptions="{ once: true, margin: '-70px' }"
        :transition="{ duration: 0.62, delay: index * 0.07, ease: 'easeOut' }"
      >
        <div v-if="event.imageUrl" class="event-image">
          <img :src="event.imageUrl" :alt="event.title" />
        </div>
        <div class="event-copy">
          <p v-if="eventDate(event)" class="event-date">{{ eventDate(event) }}</p>
          <h3>{{ event.title }}</h3>
          <p v-if="event.summary" class="event-summary">{{ event.summary }}</p>
          <v-btn
            v-if="event.ctaUrl && event.ctaLabel"
            :href="event.ctaUrl"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="primary"
          >
            {{ event.ctaLabel }}
          </v-btn>
        </div>
      </motion.article>
    </div>
  </section>
</template>
