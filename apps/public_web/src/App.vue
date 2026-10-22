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
import { usePublicLocale } from "@/core/locale";
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
  syncDocumentBrand({
    title: nextContent.identity.name,
    description: `${nextContent.identity.name}，${nextContent.identity.mission}。`,
    iconUrl: versionAssetUrl(nextContent.identity.logoUrl, nextContent.updatedAt)
  });
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

function versionAssetUrl(url: string, version: string) {
  const assetUrl = new URL(url, window.location.origin);
  assetUrl.searchParams.set("v", version);
  return assetUrl.toString();
}

function syncDocumentBrand(input: {
  title: string;
  description: string;
  iconUrl: string;
}) {
  document.title = input.title;
  setMetaContent("description", input.description);
  setIconLink("icon", input.iconUrl, "image/png");
  setIconLink("apple-touch-icon", input.iconUrl);
}

function setMetaContent(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  );
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.append(element);
  }
  element.content = content;
}

function setIconLink(rel: string, href: string, type?: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
  if (type) {
    element.type = type;
  }
}
</script>

<template>
  <v-app :class="{ 'intro-active': showIntro }">
    <template v-if="content">
      <OpeningIntro
        v-if="showIntro"
        :identity="content.identity"
        :hero="content.hero"
        @complete="completeIntro"
      />
      <v-main class="landing-main">
        <LandingLanguageMenu
          v-if="!showIntro"
          :current-locale="locale"
          :error-message="hasError ? t('refreshError') : ''"
          :is-loading="isLoading"
          :label="t('changeLanguage')"
          :options="localeOptions"
          :retry-label="t('retry')"
          @change="setLocale"
          @retry="retry"
        />
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
</template>
