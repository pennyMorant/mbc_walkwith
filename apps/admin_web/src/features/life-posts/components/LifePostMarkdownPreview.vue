<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    markdown?: string;
    emptyText?: string;
    dense?: boolean;
  }>(),
  {
    markdown: "",
    emptyText: "",
    dense: false
  }
);

const renderer = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

const renderedMarkdown = computed(() => {
  const value = props.markdown.trim();
  return value ? renderer.render(value) : "";
});
</script>

<template>
  <div
    v-if="renderedMarkdown"
    class="markdown-preview"
    :class="{ 'markdown-preview--dense': dense }"
    v-html="renderedMarkdown"
  />
  <div
    v-else-if="emptyText"
    class="markdown-preview markdown-preview--empty text-medium-emphasis"
    :class="{ 'markdown-preview--dense': dense }"
  >
    {{ emptyText }}
  </div>
</template>

<style scoped>
.markdown-preview {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.95rem;
  line-height: 1.65;
}

.markdown-preview--dense {
  font-size: 0.875rem;
  line-height: 1.55;
}

.markdown-preview--empty {
  font-style: italic;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  line-height: 1.25;
  margin: 0 0 0.55rem;
}

.markdown-preview :deep(h1) {
  font-size: 1.35rem;
}

.markdown-preview :deep(h2) {
  font-size: 1.15rem;
}

.markdown-preview :deep(h3) {
  font-size: 1rem;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(blockquote) {
  margin: 0 0 0.75rem;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.25rem;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-surface-variant));
  padding: 0.5rem 0.75rem;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
}

.markdown-preview :deep(a) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.markdown-preview :deep(:last-child) {
  margin-bottom: 0;
}
</style>
