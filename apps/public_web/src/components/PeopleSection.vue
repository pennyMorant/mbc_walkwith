<script setup lang="ts">
import type { PublicLandingPeopleSection } from "@mbc/api-contracts";
import { motion } from "motion-v";

defineProps<{
  people: PublicLandingPeopleSection;
}>();
</script>

<template>
  <section v-if="people.items.length" id="people" class="section people-section">
    <div class="section-heading">
      <p class="eyebrow">{{ people.eyebrow }}</p>
      <h2>{{ people.title }}</h2>
      <p>{{ people.body }}</p>
    </div>

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
          <img v-if="person.imageUrl" :src="person.imageUrl" :alt="person.name" />
          <v-icon v-else icon="mdi-account-heart-outline" size="42" />
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
