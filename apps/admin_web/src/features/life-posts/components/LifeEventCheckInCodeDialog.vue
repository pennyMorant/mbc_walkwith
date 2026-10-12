<script setup lang="ts">
import type { EventCheckInCode, LifePost } from "@mbc/api-contracts";
import QRCode from "qrcode";
import { nextTick, ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import { formatDateTime } from "../life_post_presenters";

const props = defineProps<{
  show: boolean;
  code: EventCheckInCode | null;
  post: LifePost;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  rotate: [];
}>();

const { t } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const qrDataUrl = ref("");
const qrErrorMessage = ref("");

watch(
  () => [props.show, props.code?.qrPayload],
  () => {
    if (props.show && props.code) {
      renderQrCode();
    }
  },
  { immediate: true }
);

async function renderQrCode() {
  await nextTick();
  if (!canvasRef.value || !props.code) {
    return;
  }
  qrErrorMessage.value = "";
  qrDataUrl.value = "";
  try {
    await QRCode.toCanvas(canvasRef.value, props.code.qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280
    });
    qrDataUrl.value = await QRCode.toDataURL(props.code.qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 420
    });
  } catch {
    qrErrorMessage.value = t("common.error");
  }
}

function printCode() {
  if (!props.code || !qrDataUrl.value) {
    return;
  }
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }
  printWindow.document.write(printMarkup(props.post, props.code, qrDataUrl.value));
  printWindow.document.close();
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };
  const image = printWindow.document.querySelector("img");
  if (image?.complete) {
    window.setTimeout(triggerPrint, 0);
  } else {
    image?.addEventListener("load", triggerPrint, { once: true });
  }
}

function printMarkup(post: LifePost, code: EventCheckInCode, dataUrl: string) {
  const dateLabel = formatDateTime(post.startsAt);
  const expiresLabel = formatDateTime(code.expiresAt);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(post.title)} - ${escapeHtml(t("Check-in QR"))}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
    main { max-width: 720px; margin: 0 auto; text-align: center; }
    img { width: 420px; max-width: 80vw; }
    h1 { font-size: 32px; margin: 0 0 8px; }
    .meta { font-size: 18px; margin: 0 0 24px; color: #4b5563; }
    .short-code { font-size: 28px; font-weight: 800; letter-spacing: 0.08em; }
    .hint { margin-top: 22px; font-size: 18px; }
    .expires { margin-top: 14px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="meta">${escapeHtml(dateLabel)}</p>
    <img src="${dataUrl}" alt="${escapeHtml(t("Check-in QR"))}" />
    <p class="hint">${escapeHtml(t("Open MBCG App and scan this QR to check in."))}</p>
    <p class="short-code">${escapeHtml(code.shortCode)}</p>
    <p class="expires">${escapeHtml(expiresLabel)}</p>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return replacements[char] ?? char;
  });
}
</script>

<template>
  <v-dialog
    :model-value="show"
    max-width="520"
    scrollable
    @update:model-value="(value) => !value && emit('close')"
  >
    <v-card class="check-in-dialog-card">
      <v-card-title class="d-flex align-center justify-space-between ga-3">
        <span>{{ t("Check-in QR") }}</span>
        <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
      </v-card-title>
      <v-card-text>
        <v-alert v-if="qrErrorMessage" type="error" variant="tonal" class="mb-4">
          {{ qrErrorMessage }}
        </v-alert>
        <div class="text-center">
          <canvas ref="canvasRef" class="check-in-qr" />
          <div v-if="code" class="mt-3">
            <div class="text-h6 font-weight-black">{{ code.shortCode }}</div>
            <div class="text-caption text-medium-emphasis">
              {{
                code.expiresAt
                  ? `${t("Expires")} ${formatDateTime(code.expiresAt)}`
                  : t("No expiration")
              }}
            </div>
          </div>
          <div class="text-body-2 text-medium-emphasis mt-4">
            {{ t("Open MBCG App and scan this QR to check in.") }}
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="tonal" :loading="loading" @click="emit('rotate')">
          {{ t("Rotate code") }}
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="emit('close')">
          {{ t("Close") }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!code || !qrDataUrl"
          @click="printCode"
        >
          {{ t("Print") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.check-in-qr {
  width: min(280px, 70vw, 38dvh);
  height: auto;
  aspect-ratio: 1;
}

.check-in-dialog-card {
  max-height: calc(100dvh - 32px);
}
</style>
