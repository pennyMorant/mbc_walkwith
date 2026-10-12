import type {
  ContentLocale,
  CreateLocalSermonDraftRequest,
  Sermon,
  UpdateSermonRequest
} from "@mbc/api-contracts";

export type ManualSermonFormValues = {
  sourceLocale: ContentLocale;
  title: string;
  speaker: string;
  sermonDate: string;
  series: string;
  topics: string[];
  primaryReference: string;
  summary: string;
  transcriptText: string;
  transcriptSource: string;
  reviewMarkdown: string;
};

export type ManualSermonCreateIntent = {
  draft: CreateLocalSermonDraftRequest;
  selectedSermonId: string | null;
  detailDrawerOpen: boolean;
};

export type SermonUpdateIntent = {
  sermonId: string;
  revision: number;
  payload: UpdateSermonRequest;
};

export type SermonCommandIntent = {
  sermonId: string;
  revision: number;
};

export function manualSermonCreateIntent(
  form: ManualSermonFormValues,
  view: { selectedSermonId: string | null; detailDrawerOpen: boolean }
): ManualSermonCreateIntent {
  const transcriptText = form.transcriptText.trim();
  const reviewMarkdown = form.reviewMarkdown.trim();
  return {
    draft: {
      sourceLocale: form.sourceLocale,
      title: form.title.trim(),
      speaker: form.speaker.trim(),
      sermonDate: form.sermonDate.trim(),
      series: blankToNull(form.series),
      topics: cleanTopics(form.topics),
      primaryReference: blankToNull(form.primaryReference),
      summary: blankToNull(form.summary),
      ...(transcriptText
        ? {
            transcript: {
              text: transcriptText,
              source: blankToNull(form.transcriptSource),
              updatedAt: null
            }
          }
        : {}),
      ...(reviewMarkdown ? { reviewMarkdown } : {})
    },
    selectedSermonId: view.selectedSermonId,
    detailDrawerOpen: view.detailDrawerOpen
  };
}

export function sameManualSermonCreateIntent(
  form: ManualSermonFormValues,
  intent: ManualSermonCreateIntent
) {
  const current = manualSermonCreateIntent(form, {
    selectedSermonId: intent.selectedSermonId,
    detailDrawerOpen: intent.detailDrawerOpen
  });
  return samePayload(current.draft, intent.draft);
}

export function isManualSermonCreateViewCurrent(
  selectedSermon: Pick<Sermon, "id"> | null,
  detailDrawerOpen: boolean,
  intent: ManualSermonCreateIntent
) {
  return (
    (selectedSermon?.id ?? null) === intent.selectedSermonId &&
    detailDrawerOpen === intent.detailDrawerOpen
  );
}

export function sermonUpdateIntent(
  sermonId: string,
  revision: number,
  payload: UpdateSermonRequest
): SermonUpdateIntent {
  return { sermonId, revision, payload };
}

export function sameSermonUpdateIntent(
  selectedSermon: Pick<Sermon, "id" | "revision"> | null,
  payload: UpdateSermonRequest,
  intent: SermonUpdateIntent
) {
  return selectedSermon?.id === intent.sermonId &&
    selectedSermon.revision === intent.revision &&
    samePayload(payload, intent.payload);
}

export function sermonCommandIntent(
  sermonId: string,
  revision: number
): SermonCommandIntent {
  return { sermonId, revision };
}

export function isCurrentSermonIntent(
  selectedSermon: Pick<Sermon, "id" | "revision"> | null,
  intent: SermonCommandIntent
) {
  return selectedSermon?.id === intent.sermonId &&
    selectedSermon.revision === intent.revision;
}

function samePayload(left: object | null, right: object | null) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function blankToNull(value: string): string | null {
  const clean = value.trim();
  return clean ? clean : null;
}

function cleanTopics(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
