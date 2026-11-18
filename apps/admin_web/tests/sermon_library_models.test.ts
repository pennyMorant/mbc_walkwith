import { describe, expect, test } from "bun:test";

import {
  createSermonLibraryFilterForm,
  sameSermonLibraryFilters,
  sermonLibraryFilterSnapshot
} from "../src/features/sermons/sermon_library_models";

describe("sermon library models", () => {
  test("creates a normalized immutable snapshot when filters are applied", () => {
    const form = createSermonLibraryFilterForm();
    form.query = "  grace  ";
    form.speaker = "  Pastor Chen ";
    form.status = "published";

    const applied = sermonLibraryFilterSnapshot(form);
    form.query = "hope";

    expect(applied).toEqual({
      query: "grace",
      status: "published",
      speaker: "Pastor Chen",
      series: "",
      topic: ""
    });
    expect(
      sameSermonLibraryFilters(
        applied,
        sermonLibraryFilterSnapshot({
          ...form,
          query: " grace ",
          speaker: "Pastor Chen"
        })
      )
    ).toBeTrue();
  });

  test("keeps desktop and mobile sermon results on the same open intent", async () => {
    const [component, messages] = await Promise.all([
      Bun.file(
        new URL(
          "../src/features/sermons/components/SermonLibraryCard.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(new URL("../src/core/i18n/i18n.ts", import.meta.url)).text()
    ]);

    expect(component).toContain("AdminResponsiveTable");
    expect(component).toContain('<template #desktop>');
    expect(component).toContain('<template #mobile>');
    expect(component).not.toContain('class="d-none d-md-block"');
    expect(component).not.toContain('class="d-md-none"');
    expect(component).toContain("<AdminMobileRecord");
    expect(component).toContain("AdminFilterToolbar");
    expect(component).toContain("@apply=\"emit('search')\"");
    expect(component).toContain('type="submit"');
    expect(component).toContain("@activate=\"emit('open', sermon)\"");
    expect(component).toContain(":title=\"t('sermons.noResults')\"");
    expect(messages.split('"sermons.noResults":').length - 1).toBe(4);
  });
});
