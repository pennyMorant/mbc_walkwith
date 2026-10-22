<script setup lang="ts">
import LandingLoadBackdrop from "@/components/LandingLoadBackdrop.vue";

defineProps<{
  errorMessage: string;
  errorTitle: string;
  isLoading: boolean;
  loadingMessage: string;
  loadingTitle: string;
  retryLabel: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="landing-load-state">
    <LandingLoadBackdrop />
    <section
      class="landing-load-content"
      :aria-busy="isLoading"
      aria-live="polite"
      :role="isLoading ? 'status' : 'alert'"
    >
      <div class="landing-load-mark" aria-hidden="true">
        <span class="landing-load-ring" />
        <img src="/mbc_web_logo.png" alt="" />
      </div>

      <template v-if="isLoading">
        <h1>{{ loadingTitle }}</h1>
        <p>{{ loadingMessage }}</p>
        <div class="landing-load-progress" aria-hidden="true">
          <span />
        </div>
      </template>

      <template v-else>
        <h1>{{ errorTitle }}</h1>
        <p>{{ errorMessage }}</p>
        <v-btn
          class="landing-load-retry"
          color="primary"
          prepend-icon="mdi-refresh"
          size="large"
          variant="flat"
          @click="$emit('retry')"
        >
          {{ retryLabel }}
        </v-btn>
      </template>
    </section>
  </div>
</template>

<style scoped>
.landing-load-state {
  position: relative;
  display: grid;
  min-height: 100svh;
  place-items: center;
  overflow: hidden;
  padding: 32px 20px;
  background:
    radial-gradient(circle at 50% 32%, rgba(246, 223, 159, 0.18), transparent 28%),
    radial-gradient(circle at 78% 72%, rgba(112, 178, 130, 0.12), transparent 32%),
    linear-gradient(180deg, #07110d 0%, #0b1711 58%, #07100c 100%);
  color: #f8f2e4;
}

.landing-load-content {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  width: min(440px, 100%);
  text-align: center;
}

.landing-load-mark {
  position: relative;
  display: grid;
  width: 128px;
  aspect-ratio: 1;
  margin-bottom: 30px;
  place-items: center;
}

.landing-load-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 238, 192, 0.3);
  border-radius: 50%;
  box-shadow: 0 0 36px rgba(255, 227, 159, 0.16);
}

.landing-load-mark img {
  width: 68%;
  height: 68%;
  object-fit: contain;
  filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.34));
}

.landing-load-content h1 {
  margin: 0;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: clamp(1.55rem, 5vw, 2rem);
  font-weight: 600;
  letter-spacing: 0;
}

.landing-load-content p {
  max-width: 360px;
  margin: 12px 0 0;
  color: rgba(248, 242, 228, 0.68);
  font-size: 0.98rem;
  line-height: 1.7;
}

.landing-load-progress {
  width: min(180px, 48vw);
  height: 3px;
  margin-top: 30px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.landing-load-progress span {
  display: block;
  width: 48%;
  height: 100%;
  border-radius: inherit;
  background: #f2d48f;
  box-shadow: 0 0 14px rgba(242, 212, 143, 0.48);
  animation: landing-load-progress 1.35s ease-in-out infinite;
}

.landing-load-retry {
  min-height: 46px;
  margin-top: 28px;
  padding-inline: 22px !important;
  border-radius: 999px !important;
}

@keyframes landing-load-progress {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(220%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-load-progress span {
    animation: none;
  }

  .landing-load-progress span {
    width: 100%;
  }
}
</style>
