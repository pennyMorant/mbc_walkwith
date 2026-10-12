<script setup lang="ts">
import AppInvitationSection from "@/components/AppInvitationSection.vue";
import ChurchEntranceSection from "@/components/ChurchEntranceSection.vue";
import ContactFooter from "@/components/ContactFooter.vue";
import HeroSection from "@/components/HeroSection.vue";
import MissionSection from "@/components/MissionSection.vue";
import OpeningIntro from "@/components/OpeningIntro.vue";
import ServiceInfoSection from "@/components/ServiceInfoSection.vue";
import { useLandingContent } from "@/composables/use_landing_content";
import { usePublicLocale } from "@/core/locale";
import { computed, ref, watch } from "vue";

const { locale, t } = usePublicLocale();
const { content, hasError, isLoading } = useLandingContent(locale);

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
        <HeroSection :identity="content.identity" :hero="content.hero" />
        <MissionSection :mission="content.mission" />
        <ServiceInfoSection :service="content.service" />
        <ChurchEntranceSection :entrance="content.entrance" />
        <AppInvitationSection :app="content.app" />
        <ContactFooter
          :contact="content.contact"
          :footer-actions="content.footerActions"
        />
      </v-main>
    </template>

    <v-main v-else class="landing-state">
      <v-progress-circular v-if="isLoading" indeterminate color="primary" />
      <div v-else class="landing-state-panel">
        <v-icon icon="mdi-alert-circle-outline" size="36" />
        <p>{{ hasError ? t("loadingError") : "" }}</p>
      </div>
    </v-main>
  </v-app>
</template>
