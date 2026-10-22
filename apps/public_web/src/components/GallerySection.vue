<script setup lang="ts">
import type { PublicLandingGallerySection } from "@mbc/api-contracts";
import { motion } from "motion-v";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import LandingMediaImage from "@/components/LandingMediaImage.vue";
import { stepGalleryIndex } from "@/core/gallery_navigation";
import { usePublicLocale } from "@/core/locale";

const props = defineProps<{ gallery: PublicLandingGallerySection }>();
const selectedIndex = ref(-1);
const dialogOpen = computed({
  get: () => selectedIndex.value >= 0,
  set: (open: boolean) => {
    if (!open) {
      selectedIndex.value = -1;
    }
  }
});
const selectedItem = computed(() => props.gallery.items[selectedIndex.value] ?? null);
const { t } = usePublicLocale();

function openPhoto(index: number) {
  selectedIndex.value = index;
}

function photoLabel(index: number) {
  const item = props.gallery.items[index];
  const description = item?.altText || item?.title;
  return description ? `${t("viewPhoto")}: ${description}` : `${t("viewPhoto")} ${index + 1}`;
}

function stepPhoto(direction: -1 | 1) {
  selectedIndex.value = stepGalleryIndex(
    selectedIndex.value,
    props.gallery.items.length,
    direction
  );
}

function handleKeydown(event: KeyboardEvent) {
  if (!dialogOpen.value || props.gallery.items.length < 2) {
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepPhoto(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    stepPhoto(1);
  }
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <section v-if="gallery.items.length" id="gallery" class="section gallery-section">
    <div class="gallery-heading">
      <p class="eyebrow">{{ gallery.eyebrow }}</p>
      <h2>{{ gallery.title }}</h2>
      <p>{{ gallery.body }}</p>
    </div>
    <div class="gallery-grid">
      <motion.button
        v-for="(item, index) in gallery.items"
        :key="item.id"
        class="gallery-item"
        :class="{ 'gallery-item--wide': index % 5 === 0 }"
        type="button"
        :aria-label="photoLabel(index)"
        :initial="{ opacity: 0, y: 24, scale: 0.98 }"
        :whileInView="{ opacity: 1, y: 0, scale: 1 }"
        :inViewOptions="{ once: true, margin: '-60px' }"
        :transition="{
          duration: 0.62,
          delay: Math.min(index, 5) * 0.06,
          ease: 'easeOut'
        }"
        @click="openPhoto(index)"
      >
        <LandingMediaImage
          :src="item.imageUrl"
          :alt="item.altText || item.title || photoLabel(index)"
        />
        <span v-if="item.title || item.body" class="gallery-item-caption">
          <strong v-if="item.title">{{ item.title }}</strong>
          <span v-if="item.body">{{ item.body }}</span>
        </span>
      </motion.button>
    </div>

    <v-dialog v-model="dialogOpen" max-width="1120" scroll-strategy="block">
      <v-card v-if="selectedItem" class="gallery-viewer">
        <v-btn
          class="gallery-viewer-close"
          icon="mdi-close"
          :aria-label="t('closePhoto')"
          :title="t('closePhoto')"
          variant="text"
          @click="dialogOpen = false"
        />

        <div class="gallery-viewer-stage">
          <v-btn
            v-if="gallery.items.length > 1"
            class="gallery-viewer-nav gallery-viewer-nav--previous"
            icon="mdi-chevron-left"
            :aria-label="t('previousPhoto')"
            :title="t('previousPhoto')"
            variant="tonal"
            @click="stepPhoto(-1)"
          />
          <LandingMediaImage
            :src="selectedItem.imageUrl"
            :alt="selectedItem.altText || selectedItem.title || photoLabel(selectedIndex)"
            loading="eager"
          />
          <v-btn
            v-if="gallery.items.length > 1"
            class="gallery-viewer-nav gallery-viewer-nav--next"
            icon="mdi-chevron-right"
            :aria-label="t('nextPhoto')"
            :title="t('nextPhoto')"
            variant="tonal"
            @click="stepPhoto(1)"
          />
        </div>

        <div v-if="selectedItem.title || selectedItem.body" class="gallery-viewer-caption">
          <strong v-if="selectedItem.title">{{ selectedItem.title }}</strong>
          <span v-if="selectedItem.body">{{ selectedItem.body }}</span>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>
