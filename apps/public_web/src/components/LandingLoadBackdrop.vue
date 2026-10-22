<template>
  <div class="landing-load-backdrop" aria-hidden="true">
    <span class="landing-load-beam" />
    <span class="landing-load-horizon" />

    <div class="landing-load-frame landing-load-frame--left">
      <v-icon icon="mdi-church-outline" size="34" />
      <span />
      <i />
    </div>
    <div class="landing-load-frame landing-load-frame--center">
      <v-icon icon="mdi-calendar-heart" size="32" />
      <span />
      <i />
    </div>
    <div class="landing-load-frame landing-load-frame--right">
      <v-icon icon="mdi-account-group-outline" size="34" />
      <span />
      <i />
    </div>
  </div>
</template>

<style scoped>
.landing-load-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.landing-load-beam {
  position: absolute;
  top: -18%;
  left: 50%;
  width: min(54vw, 720px);
  height: 118%;
  background: linear-gradient(
    104deg,
    transparent 4%,
    rgba(255, 239, 194, 0.04) 24%,
    rgba(255, 244, 215, 0.2) 50%,
    rgba(255, 239, 194, 0.05) 72%,
    transparent 96%
  );
  filter: blur(2px);
  opacity: 0.78;
  transform: translateX(-50%) skewX(-8deg);
  transform-origin: top center;
  animation: landing-load-beam 4.2s ease-in-out infinite;
}

.landing-load-horizon {
  position: absolute;
  right: -10%;
  bottom: 15%;
  left: -10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(246, 223, 159, 0.26), transparent);
  box-shadow: 0 0 34px rgba(246, 223, 159, 0.12);
}

.landing-load-frame {
  position: absolute;
  bottom: 7%;
  display: grid;
  width: min(260px, 23vw);
  min-width: 180px;
  aspect-ratio: 1.45;
  align-content: end;
  gap: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(43, 84, 61, 0.18)),
    rgba(5, 13, 9, 0.28);
  color: rgba(246, 223, 159, 0.34);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
  opacity: 0.66;
  backdrop-filter: blur(12px);
}

.landing-load-frame span,
.landing-load-frame i {
  display: block;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
}

.landing-load-frame span {
  width: 70%;
}

.landing-load-frame i {
  width: 44%;
}

.landing-load-frame--left {
  left: 3%;
  transform: rotate(-4deg);
}

.landing-load-frame--center {
  left: 50%;
  opacity: 0.38;
  transform: translateX(-50%) translateY(34%);
}

.landing-load-frame--right {
  right: 3%;
  transform: rotate(4deg);
}

@keyframes landing-load-beam {
  0%,
  100% {
    opacity: 0.48;
    transform: translateX(-52%) skewX(-8deg);
  }
  50% {
    opacity: 0.84;
    transform: translateX(-48%) skewX(-8deg);
  }
}

@media (max-width: 760px) {
  .landing-load-beam {
    width: 110vw;
  }

  .landing-load-frame {
    bottom: 4%;
    width: 43vw;
    min-width: 0;
    padding: 18px;
    border-radius: 20px;
  }

  .landing-load-frame--left {
    left: -10%;
  }

  .landing-load-frame--center {
    display: none;
  }

  .landing-load-frame--right {
    right: -10%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-load-beam {
    animation: none;
  }
}
</style>
