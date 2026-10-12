<script setup lang="ts">
import { computed, ref } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import LifePostMarkdownPreview from "./LifePostMarkdownPreview.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    rows?: number;
    emptyPreviewLabel?: string;
  }>(),
  {
    rows: 8,
    emptyPreviewLabel: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();
const activeTab = ref<"edit" | "preview">("edit");
const editorRows = computed(() => props.rows ?? 8);
const editorValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value)
});

const formatActions = computed(() => [
  {
    icon: "mdi-format-header-2",
    label: t("markdown.heading"),
    snippet: "## " + t("markdown.headingPlaceholder")
  },
  {
    icon: "mdi-format-bold",
    label: t("markdown.bold"),
    snippet: "**" + t("markdown.boldPlaceholder") + "**"
  },
  {
    icon: "mdi-format-list-bulleted",
    label: t("markdown.list"),
    snippet: "- " + t("markdown.listPlaceholder")
  },
  {
    icon: "mdi-format-quote-close",
    label: t("markdown.quote"),
    snippet: "> " + t("markdown.quotePlaceholder")
  },
  {
    icon: "mdi-link-variant",
    label: t("markdown.link"),
    snippet: "[" + t("markdown.linkTextPlaceholder") + "](https://)"
  }
]);

function appendSnippet(snippet: string) {
  const current = props.modelValue.trimEnd();
  const separator = current ? "\n\n" : "";
  emit("update:modelValue", `${current}${separator}${snippet}`);
  activeTab.value = "edit";
}
</script>

<template>
  <v-sheet class="markdown-editor mb-4" rounded border>
    <div class="pa-3">
      <div
        class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-3 mb-3"
      >
        <div class="text-subtitle-2 font-weight-bold">
          {{ label }}
        </div>
        <v-btn-toggle
          v-model="activeTab"
          density="compact"
          mandatory
          variant="outlined"
        >
          <v-btn value="edit" size="small">
            {{ t("common.edit") }}
          </v-btn>
          <v-btn value="preview" size="small">
            {{ t("common.preview") }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-tooltip
          v-for="action in formatActions"
          :key="action.label"
          :text="action.label"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :aria-label="action.label"
              :icon="action.icon"
              size="small"
              variant="tonal"
              @click="appendSnippet(action.snippet)"
            />
          </template>
        </v-tooltip>
      </div>

      <v-window v-model="activeTab">
        <v-window-item value="edit">
          <v-textarea
            v-model="editorValue"
            :aria-label="label"
            :rows="editorRows"
            auto-grow
            density="comfortable"
            hide-details
            variant="outlined"
          />
        </v-window-item>
        <v-window-item value="preview">
          <div class="markdown-editor__preview">
            <LifePostMarkdownPreview
              :markdown="modelValue"
              :empty-text="emptyPreviewLabel || t('markdown.previewEmpty')"
            />
          </div>
        </v-window-item>
      </v-window>
    </div>
  </v-sheet>
</template>

<style scoped>
.markdown-editor {
  background: rgb(var(--v-theme-surface));
}

.markdown-editor__preview {
  min-height: 180px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 16px;
}
</style>
