<script setup lang="ts">
import type { ContentLocale, LocalizedResourceType } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import {
  autoTranslateContentLocalization,
  listContentLocalizations,
  saveContentLocalization
} from "@/core/api/content_localizations";
import { useI18n } from "@/core/i18n/i18n";

const props = withDefaults(
  defineProps<{
    resourceType: LocalizedResourceType;
    resourceId: string;
    revision: number;
    fields: Record<string, string>;
    canEdit: boolean;
    canUseAi: boolean;
    sourceLocale?: ContentLocale;
  }>(),
  { sourceLocale: "zh-Hans" }
);
const emit = defineEmits<{
  "update:sourceLocale": [locale: ContentLocale];
}>();

const localeOptions: Array<{ title: string; value: ContentLocale }> = [
  { title: "English", value: "en" },
  { title: "Español", value: "es" },
  { title: "简体中文", value: "zh-Hans" },
  { title: "繁體中文", value: "zh-Hant" }
];

const { t } = useI18n();
const queryClient = useQueryClient();
const locale = ref<ContentLocale>("en");
const fields = reactive<Record<string, string>>({});
const generatingLocales = ref<ContentLocale[]>([]);
const failedLocales = ref<ContentLocale[]>([]);
const actionError = ref("");
const queryKey = computed(() => [
  "content-localizations",
  props.resourceType,
  props.resourceId
]);
const translations = useQuery({
  queryKey,
  queryFn: () =>
    listContentLocalizations(props.resourceType, props.resourceId),
  enabled: computed(() => Boolean(props.resourceId))
});
const current = computed(() =>
  translations.data.value?.items.find(
    (item) =>
      item.locale === locale.value && item.sourceVersion === props.revision
  )
);
const selectedSourceLocale = computed({
  get: () => props.sourceLocale,
  set: (value: ContentLocale) => emit("update:sourceLocale", value)
});
const isSourceLocale = computed(
  () => locale.value === selectedSourceLocale.value
);
const currentStatus = computed(() => {
  if (isSourceLocale.value) return t("localization.source");
  if (!current.value) return t("localization.missing");
  return current.value.source === "ai"
    ? t("localization.aiGenerated")
    : t("localization.handwritten");
});
const isGeneratingAll = computed(() => generatingLocales.value.length > 0);
const translationsByLocale = computed(
  () =>
    new Map(
      (translations.data.value?.items ?? [])
        .filter((translation) => translation.sourceVersion === props.revision)
        .map((translation) => [translation.locale, translation])
    )
);

watch(
  [current, () => props.fields, selectedSourceLocale],
  () => {
    const next = isSourceLocale.value ? props.fields : current.value?.fields ?? props.fields;
    for (const key of Object.keys(fields)) delete fields[key];
    Object.assign(fields, next);
  },
  { immediate: true, deep: true }
);

const saveMutation = useMutation({
  mutationFn: () =>
    saveContentLocalization(props.resourceType, props.resourceId, locale.value, {
      sourceVersion: props.revision,
      source: "admin",
      provider: null,
      model: null,
      fields: { ...fields }
    }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey.value })
});

const autoMutation = useMutation({
  mutationFn: (targetLocale: ContentLocale) =>
    autoTranslateContentLocalization(
      props.resourceType,
      props.resourceId,
      targetLocale,
      props.revision
    ),
  onSuccess: async (value, targetLocale) => {
    if (targetLocale === locale.value) Object.assign(fields, value.fields);
    await queryClient.invalidateQueries({ queryKey: queryKey.value });
  }
});

function save() {
  if (!props.canEdit || isSourceLocale.value) return;
  actionError.value = "";
  saveMutation.mutate();
}

function generate(localeToGenerate = locale.value) {
  if (
    !props.canEdit ||
    !props.canUseAi ||
    localeToGenerate === selectedSourceLocale.value ||
    autoMutation.isPending.value
  ) {
    return;
  }
  actionError.value = "";
  const existing = translationsByLocale.value.get(localeToGenerate);
  if (
    existing &&
    !window.confirm(t("localization.confirmOverwrite"))
  ) {
    return;
  }
  autoMutation.mutate(localeToGenerate, {
    onError: () => {
      actionError.value = t("localization.generationFailed");
    }
  });
}

async function generateAll() {
  if (!props.canEdit || !props.canUseAi || isGeneratingAll.value) return;
  const targets = localeOptions
    .map((item) => item.value)
    .filter(
      (value) =>
        value !== selectedSourceLocale.value &&
        !translationsByLocale.value.has(value)
    );
  if (targets.length === 0) return;
  actionError.value = "";
  failedLocales.value = [];

  generatingLocales.value = targets;
  try {
    for (const target of targets) {
      try {
        await autoMutation.mutateAsync(target);
      } catch {
        failedLocales.value = [...failedLocales.value, target];
      }
    }
  } finally {
    generatingLocales.value = [];
    if (failedLocales.value.length > 0) {
      actionError.value = t("localization.someGenerationFailed");
    }
  }
}

function translationChipColor(targetLocale: ContentLocale) {
  if (generatingLocales.value.includes(targetLocale)) return "primary";
  if (failedLocales.value.includes(targetLocale)) return "error";
  return translationsByLocale.value.has(targetLocale) ? "success" : "warning";
}

function translationChipLabel(targetLocale: ContentLocale) {
  if (generatingLocales.value.includes(targetLocale)) return t("localization.generating");
  if (failedLocales.value.includes(targetLocale)) return t("localization.failed");
  return translationsByLocale.value.has(targetLocale)
    ? t("localization.ready")
    : t("localization.missing");
}
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap">
      <span>{{ t("localization.title") }}</span>
      <v-btn
        color="primary"
        size="small"
        variant="tonal"
        :disabled="!canEdit || !canUseAi || isGeneratingAll"
        :loading="isGeneratingAll"
        @click="generateAll"
      >
        {{ t("localization.generateMissing") }}
      </v-btn>
    </v-card-title>
    <v-tabs v-model="locale" density="compact" grow>
      <v-tab
        v-for="item in localeOptions"
        :key="item.value"
        :value="item.value"
      >
        {{ item.title }}
        <v-chip
          v-if="item.value !== selectedSourceLocale"
          class="ml-2"
          size="x-small"
          :color="translationChipColor(item.value)"
          variant="tonal"
        >
          {{ translationChipLabel(item.value) }}
        </v-chip>
      </v-tab>
    </v-tabs>
    <v-card-text>
      <v-select
        v-model="selectedSourceLocale"
        :items="localeOptions"
        :label="t('localization.sourceLanguage')"
        density="compact"
        class="mb-2"
      />
      <div class="d-flex align-center justify-space-between ga-3 mb-4">
        <v-chip size="small" variant="tonal">
          {{ currentStatus }}
        </v-chip>
        <span v-if="isGeneratingAll" class="text-caption text-medium-emphasis">
          {{ t("localization.generating") }}
        </span>
      </div>
      <v-alert v-if="actionError" class="mb-4" type="error" variant="tonal">
        {{ actionError }}
      </v-alert>
      <v-textarea
        v-for="(_, key) in props.fields"
        :key="key"
        v-model="fields[key]"
        :label="key"
        rows="2"
        auto-grow
        density="compact"
        :readonly="isSourceLocale"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="primary"
        :disabled="!canEdit || isSourceLocale"
        :loading="saveMutation.isPending.value"
        @click="save"
      >
        {{ t("common.save") }}
      </v-btn>
      <v-btn
        variant="tonal"
        :disabled="!canEdit || !canUseAi || isSourceLocale || isGeneratingAll"
        :loading="autoMutation.isPending.value && !isGeneratingAll"
        @click="generate()"
      >
        {{ t("localization.autoTranslate") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
