<script setup lang="ts">
import AppInvitationSection from "@/components/AppInvitationSection.vue";
import ChurchEntranceSection from "@/components/ChurchEntranceSection.vue";
import ContactFooter from "@/components/ContactFooter.vue";
import HeroSection from "@/components/HeroSection.vue";
import GallerySection from "@/components/GallerySection.vue";
import LandingLoadState from "@/components/LandingLoadState.vue";
import LandingLanguageMenu from "@/components/LandingLanguageMenu.vue";
import MissionSection from "@/components/MissionSection.vue";
import OpeningIntro from "@/components/OpeningIntro.vue";
import PeopleSection from "@/components/PeopleSection.vue";
import ScheduleSection from "@/components/ScheduleSection.vue";
import ServiceInfoSection from "@/components/ServiceInfoSection.vue";
import UpcomingEventsSection from "@/components/UpcomingEventsSection.vue";
import { useLandingContent } from "@/composables/use_landing_content";
import {
  applyLandingDocumentMetadata,
  createLandingDocumentMetadata
} from "@/core/document_metadata";
import { usePublicLocale } from "@/core/locale";
import { MotionConfig } from "motion-v";
import { computed, ref, watch } from "vue";

const { locale, localeOptions, setLocale, t } = usePublicLocale();
const { content, hasError, isLoading, retry } = useLandingContent(locale);

const introStorageKey = "mbc_public_intro_seen";
const introDismissed = ref(hasSeenIntro());
const showIntro = computed(() => Boolean(content.value) && !introDismissed.value);

watch(content, (nextContent) => {
  if (!nextContent) {
    return;
  }
  applyLandingDocumentMetadata(
    document,
    createLandingDocumentMetadata(nextContent, window.location.href)
  );
}, { immediate: true });

function completeIntro() {
  introDismissed.value = true;
  sessionStorage.setItem(introStorageKey, "1");
}

function hasSeenIntro() {
  if (shouldReplayIntro()) {
    return false;
  }
  return sessionStorage.getItem(introStorageKey) === "1";
}

function shouldReplayIntro() {
  return new URLSearchParams(window.location.search).has("intro");
}

</script>

<template>
  <MotionConfig reduced-motion="user">
    <v-app :class="{ 'intro-active': showIntro }">
      <a
        v-if="content && !showIntro"
        class="landing-skip-link"
        href="#main-content"
      >
        {{ t("skipToContent") }}
      </a>

      <LandingLanguageMenu
        v-if="!showIntro"
        :current-locale="locale"
        :error-message="content && hasError ? t('refreshError') : ''"
        :is-loading="isLoading"
        :label="t('changeLanguage')"
        :options="localeOptions"
        :retry-label="t('retry')"
        @change="setLocale"
        @retry="retry"
      />

      <template v-if="content">
        <OpeningIntro
          v-if="showIntro"
          :identity="content.identity"
          :hero="content.hero"
          @complete="completeIntro"
        />
        <v-main id="main-content" class="landing-main" tabindex="-1">
          <HeroSection :identity="content.identity" :hero="content.hero" />
          <MissionSection :mission="content.mission" />
          <ServiceInfoSection :service="content.service" />
          <ScheduleSection :schedule="content.schedule" />
          <UpcomingEventsSection
            :events="content.events"
            :locale="content.locale"
            :time-zone="content.timeZone"
          />
          <GallerySection :gallery="content.gallery" />
          <PeopleSection :people="content.people" />
          <ChurchEntranceSection :entrance="content.entrance" />
          <AppInvitationSection :app="content.app" />
          <ContactFooter
            :contact="content.contact"
            :footer-actions="content.footerActions"
          />
        </v-main>
      </template>

      <v-main v-else>
        <LandingLoadState
          :error-message="t('loadingError')"
          :error-title="t('loadingErrorTitle')"
          :is-loading="isLoading"
          :loading-message="t('loadingMessage')"
          :loading-title="t('loadingTitle')"
          :retry-label="t('retry')"
          @retry="retry"
        />
      </v-main>
    </v-app>
  </MotionConfig>
</template>
