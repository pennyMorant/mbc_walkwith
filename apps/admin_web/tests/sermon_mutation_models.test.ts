import { describe, expect, test } from "bun:test";

import {
  isManualSermonCreateViewCurrent,
  isCurrentSermonIntent,
  manualSermonCreateIntent,
  sameManualSermonCreateIntent,
  sameSermonUpdateIntent,
  sermonCommandIntent,
  sermonUpdateIntent,
  type ManualSermonFormValues
} from "../src/features/sermons/sermon_mutation_models";

describe("sermon mutation models", () => {
  test("snapshots the complete manual draft before asynchronous creation", () => {
    const form = manualForm();
    const intent = manualSermonCreateIntent(form, {
      selectedSermonId: "sermon-open",
      detailDrawerOpen: true
    });

    form.title = "A newer draft";
    form.transcriptText = "A newer manuscript";

    expect(intent.draft.title).toBe("Grace and Truth");
    expect(intent.draft.transcript?.text).toBe("Reviewed manuscript");
    expect(intent.draft.reviewMarkdown).toBe("Reviewed");
    expect(sameManualSermonCreateIntent(form, intent)).toBeFalse();
    expect(isManualSermonCreateViewCurrent(null, false, intent)).toBeFalse();

    const emptyViewIntent = manualSermonCreateIntent(manualForm(), {
      selectedSermonId: null,
      detailDrawerOpen: false
    });
    expect(
      isManualSermonCreateViewCurrent(null, false, emptyViewIntent)
    ).toBeTrue();
  });

  test("matches editor results only to the active unchanged resource", () => {
    const selected = { id: "sermon-1", revision: 3 };
    const payload = { title: "Submitted title", topics: ["Grace"] };
    const intent = sermonUpdateIntent("sermon-1", 3, payload);

    expect(sameSermonUpdateIntent(selected, payload, intent)).toBeTrue();
    expect(
      sameSermonUpdateIntent(selected, { ...payload, title: "New edit" }, intent)
    ).toBeFalse();
    expect(
      sameSermonUpdateIntent({ ...selected, revision: 4 }, payload, intent)
    ).toBeFalse();
    expect(
      isCurrentSermonIntent(selected, sermonCommandIntent("sermon-1", 3))
    ).toBeTrue();
    expect(
      isCurrentSermonIntent(selected, sermonCommandIntent("sermon-2", 3))
    ).toBeFalse();
    expect(
      isCurrentSermonIntent(selected, sermonCommandIntent("sermon-1", 2))
    ).toBeFalse();
  });
});

function manualForm(): ManualSermonFormValues {
  return {
    title: " Grace and Truth ",
    speaker: " Pastor Chen ",
    sermonDate: "2026-07-12",
    series: " John ",
    topics: [" Grace "],
    primaryReference: " John 1:14 ",
    summary: " Sunday sermon ",
    transcriptText: " Reviewed manuscript ",
    transcriptSource: " manuscript.md ",
    reviewMarkdown: " Reviewed "
  };
}
