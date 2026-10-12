import type {
  AiResourceReference,
  AiTaskInput,
  Sermon,
  SermonOutlineItem
} from "@mbc/api-contracts";
import { computed, type Ref } from "vue";

type SermonAiDraftForm = {
  title: string;
  speaker: string;
  sermonDate: string;
  series: string;
  primaryReference: string;
  summary: string;
  transcriptText: string;
  reviewMarkdown: string;
  outline: SermonOutlineItem[];
};

type UseSermonAiDraftsInput = {
  selectedSermon: Ref<Sermon | null>;
  editForm: SermonAiDraftForm;
};

export function useSermonAiDrafts(input: UseSermonAiDraftsInput) {
  const { selectedSermon, editForm } = input;

  const sermonAiResource = computed<AiResourceReference>(() => ({
    resourceType: "sermon",
    ...(selectedSermon.value?.id ? { resourceId: selectedSermon.value.id } : {})
  }));

  const sermonSummaryAiInput = computed<AiTaskInput>(() => ({
    title: editForm.title.trim(),
    body:
      editForm.transcriptText.trim() ||
      editForm.reviewMarkdown.trim() ||
      editForm.summary.trim(),
    reference: editForm.primaryReference.trim(),
    audience: "church members",
    context: compactAiContext([
      ["Speaker", editForm.speaker],
      ["Series", editForm.series],
      ["Sermon date", editForm.sermonDate]
    ])
  }));

  const sermonOutlineAiInput = computed<AiTaskInput>(() => ({
    title: editForm.title.trim(),
    body:
      editForm.transcriptText.trim() ||
      editForm.reviewMarkdown.trim() ||
      editForm.summary.trim(),
    reference: editForm.primaryReference.trim(),
    audience: "church members",
    context: compactAiContext([
      ["Speaker", editForm.speaker],
      ["Series", editForm.series],
      ["Existing summary", editForm.summary]
    ])
  }));

  function applySermonSummaryDraft(markdown: string) {
    editForm.summary = stripMarkdownHeading(markdown).slice(0, 1200);
  }

  function applySermonOutlineDraft(markdown: string) {
    editForm.outline = outlineItemsFromMarkdown(markdown, editForm.outline);
  }

  return {
    sermonAiResource,
    sermonSummaryAiInput,
    sermonOutlineAiInput,
    applySermonSummaryDraft,
    applySermonOutlineDraft
  };
}

function compactAiContext(
  entries: Array<[label: string, value: string]>
): AiTaskInput["context"] {
  return entries
    .map(([label, value]) => ({ label, value: value.trim() }))
    .filter((item) => item.value.length > 0);
}

export function outlineItemsFromMarkdown(
  markdown: string,
  existingOutline: SermonOutlineItem[] = []
): SermonOutlineItem[] {
  const candidates = markdown
    .split(/\r?\n/)
    .map((line) => ({
      isListItem: /^\s*(?:[-*]|\d+[.)])\s+/.test(line),
      value: line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    }))
    .filter((item) => item.value.length > 0)
    .filter((item) => !/^task\s*:/i.test(item.value));

  const listItems = candidates.filter((item) => item.isListItem);
  const lines = (listItems.length > 0 ? listItems : candidates)
    .map((item) => item.value)
    .slice(0, 8);

  if (lines.length === 0) {
    return [
      {
        title: "AI outline draft",
        startSeconds: existingOutline[0]?.startSeconds ?? 0,
        summary: markdown.trim()
      }
    ];
  }

  return lines.map((line, index) => {
    const [rawTitle, ...summaryParts] = line.split(/\s+-\s+|[:：]\s*/);
    return {
      title: (rawTitle || line).slice(0, 120),
      startSeconds: existingOutline[index]?.startSeconds ?? 0,
      summary: summaryParts.join(" - ").slice(0, 400)
    };
  });
}

function stripMarkdownHeading(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,6}\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}
