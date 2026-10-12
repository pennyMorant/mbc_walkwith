<script setup lang="ts">
import type {
  PublicLandingAction,
  PublicLandingContactSection
} from "@mbc/api-contracts";

import { actionRel, actionTarget } from "@/core/actions";

defineProps<{
  contact: PublicLandingContactSection;
  footerActions: PublicLandingAction[];
}>();
</script>

<template>
  <footer id="contact" class="contact-footer">
    <div>
      <p class="eyebrow">{{ contact.eyebrow }}</p>
      <h2>{{ contact.title }}</h2>
      <p>{{ contact.body }}</p>
    </div>

    <div class="footer-links">
      <a
        v-for="link in contact.links"
        :key="link.id"
        :href="link.href"
        :target="actionTarget(link)"
        :rel="actionRel(link)"
      >
        <v-icon :icon="link.iconName" />
        {{ link.title }}
      </a>
    </div>

    <div class="footer-bottom">
      <span>{{ contact.copyright }}</span>
      <a
        v-for="action in footerActions"
        :key="action.id"
        :href="action.href"
        :target="actionTarget(action)"
        :rel="actionRel(action)"
      >
        {{ action.title }}
      </a>
    </div>
  </footer>
</template>
