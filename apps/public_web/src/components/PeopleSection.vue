<script setup lang="ts">
import type { PublicLandingPeopleSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

import LandingMediaImage from "@/components/LandingMediaImage.vue";
import LandingSectionHeading from "@/components/LandingSectionHeading.vue";

defineProps<{
  people: PublicLandingPeopleSection;
}>();
</script>

<template>
  <section v-if="people.items.length" id="people" class="section people-section">
    <LandingSectionHeading
      :eyebrow="people.eyebrow"
      :title="people.title"
      :body="people.body"
    />

    <div class="people-grid">
      <motion.article
        v-for="(person, index) in people.items"
        :key="person.id"
        class="person-card"
        :initial="{ opacity: 0, y: 26 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :inViewOptions="{ once: true, margin: '-60px' }"
        :transition="{ duration: 0.6, delay: index * 0.07, ease: 'easeOut' }"
      >
        <div class="person-photo">
          <LandingMediaImage
            :src="person.imageUrl"
            :alt="person.name"
            fallback-icon="mdi-account-heart-outline"
          />
        </div>
        <div class="person-copy">
          <p class="person-role">{{ person.role }}</p>
          <h3>{{ person.name }}</h3>
          <p>{{ person.summary }}</p>
        </div>
      </motion.article>
    </div>
  </section>
</template>
