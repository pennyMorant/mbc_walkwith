import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL(
    "../src/features/settings/components/MediaImagePicker.vue",
    import.meta.url
  )
).text();

describe("media image picker", () => {
  test("keeps library loading and upload state independent", () => {
    expect(component).toContain("const libraryLoading = ref(false)");
    expect(component).toContain("const uploadLoading = ref(false)");
    expect(component).toContain("const libraryError = ref(\"\")");
    expect(component).toContain("const uploadError = ref(\"\")");
    expect(component).toContain("libraryLoading.value = true");
    expect(component).toContain("libraryLoading.value = false");
    expect(component).toContain(':loading="uploadLoading"');
  });

  test("uses shared retryable data presentation for the media library", () => {
    expect(component).toContain(
      'import AdminDataState from "@/core/ui/AdminDataState.vue"'
    );
    expect(component).toContain("<AdminDataState");
    expect(component).toContain(':error-message="libraryError"');
    expect(component).toContain(':retry-label="t(\'common.refresh\')"');
    expect(component).toContain('@retry="loadAssets"');
    expect(component).not.toContain("<v-empty-state");
  });

  test("exposes the selected asset visually and semantically", () => {
    expect(component).toContain("media-option--selected");
    expect(component).toContain(':aria-pressed="asset.id === modelValue"');
    expect(component).toContain('icon="mdi-check-circle"');
    expect(component).toContain(".media-option:focus-visible");
  });
});
