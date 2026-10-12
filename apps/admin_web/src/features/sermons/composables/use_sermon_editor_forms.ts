import type {
  ContentLocale,
  Sermon,
  SermonOutlineItem,
  SermonReference,
  UpdateSermonRequest
} from "@mbc/api-contracts";
import { computed, reactive, ref, type Ref } from "vue";

type Translate = (key: string) => string;
type PermissionReader = { can(permission: string): boolean };

type UseSermonEditorFormsInput = {
  selectedSermon: Ref<Sermon | null>;
  authStore: PermissionReader;
  t: Translate;
};

export function useSermonEditorForms(input: UseSermonEditorFormsInput) {
  const { selectedSermon, authStore, t } = input;
  const selectedManualManuscriptFile = ref<File | File[] | null>(null);
  const selectedTranscriptFile = ref<File | File[] | null>(null);

  const editForm = reactive({
    sourceLocale: "zh-Hans" as ContentLocale,
    title: "",
    speaker: "",
    sermonDate: "",
    series: "",
    topics: [] as string[],
    primaryReference: "",
    summary: "",
    transcriptText: "",
    transcriptSource: "",
    reviewMarkdown: "",
    outline: [] as SermonOutlineItem[],
    references: [] as SermonReference[]
  });

  const manualSermonForm = reactive({
    sourceLocale: "zh-Hans" as ContentLocale,
    title: "",
    speaker: "",
    sermonDate: "",
    series: "",
    topics: [] as string[],
    primaryReference: "",
    summary: "",
    transcriptText: "",
    transcriptSource: "manual",
    reviewMarkdown: ""
  });

  const cleanedOutline = computed(() =>
    editForm.outline
      .filter((item) => item.title.trim())
      .map((item) => ({
        title: item.title.trim(),
        startSeconds: Math.max(0, Number(item.startSeconds) || 0),
        summary: item.summary.trim()
      }))
  );

  const cleanedReferences = computed(() =>
    editForm.references
      .filter(
        (reference) => reference.reference.trim() && reference.verseId.trim()
      )
      .map((reference) => ({
        reference: reference.reference.trim(),
        verseId: reference.verseId.trim(),
        note: reference.note.trim(),
        startSeconds:
          reference.startSeconds === null || reference.startSeconds === undefined
            ? null
            : Math.max(0, Number(reference.startSeconds) || 0)
      }))
  );

  const cleanedManualTopics = computed(() =>
    cleanTopics(manualSermonForm.topics)
  );

  const reviewChecks = computed(() => [
    {
      label: t("Metadata"),
      ok:
        Boolean(editForm.title.trim()) &&
        Boolean(editForm.speaker.trim()) &&
        Boolean(editForm.sermonDate.trim()),
      detail: t("Title, speaker, and date")
    },
    {
      label: t("Audio"),
      ok: selectedSermon.value?.audio.status === "ready",
      detail: t("Uploaded sermon audio")
    },
    {
      label: t("Transcript"),
      ok: Boolean(editForm.transcriptText.trim()),
      detail: t("Reviewed transcript text")
    },
    {
      label: t("Outline"),
      ok: cleanedOutline.value.length > 0,
      detail: t("At least one outline section")
    },
    {
      label: t("Scripture"),
      ok: cleanedReferences.value.length > 0,
      detail: t("At least one Bible reference")
    }
  ]);

  const isReviewReady = computed(() =>
    reviewChecks.value.every((check) => check.ok)
  );

  const canCreateManualSermon = computed(
    () =>
      Boolean(manualSermonForm.title.trim()) &&
      Boolean(manualSermonForm.speaker.trim()) &&
      Boolean(manualSermonForm.sermonDate.trim()) &&
      authStore.can("sermons:create")
  );

  function applySermonToDetail(sermon: Sermon) {
    selectedSermon.value = sermon;
    editForm.title = sermon.title;
    editForm.sourceLocale = sermon.sourceLocale;
    editForm.speaker = sermon.speaker;
    editForm.sermonDate = sermon.sermonDate;
    editForm.series = sermon.series ?? "";
    editForm.topics = [...sermon.topics];
    editForm.primaryReference = sermon.primaryReference ?? "";
    editForm.summary = sermon.summary ?? "";
    editForm.transcriptText = sermon.transcript?.text ?? "";
    editForm.transcriptSource = sermon.transcript?.source ?? "";
    editForm.reviewMarkdown = sermon.reviewMarkdown ?? "";
    editForm.outline = sermon.outline.map((item) => ({ ...item }));
    editForm.references = sermon.references.map((reference) => ({
      ...reference
    }));
  }

  function resetManualSermonForm() {
    manualSermonForm.title = "";
    manualSermonForm.sourceLocale = "zh-Hans";
    manualSermonForm.speaker = "";
    manualSermonForm.sermonDate = "";
    manualSermonForm.series = "";
    manualSermonForm.topics = [];
    manualSermonForm.primaryReference = "";
    manualSermonForm.summary = "";
    manualSermonForm.transcriptText = "";
    manualSermonForm.transcriptSource = "manual";
    manualSermonForm.reviewMarkdown = "";
    selectedManualManuscriptFile.value = null;
  }

  async function importManualManuscriptFile(value: File | File[] | null) {
    const file = firstInputFile(value);
    if (!file) {
      return;
    }
    manualSermonForm.transcriptText = await file.text();
    manualSermonForm.transcriptSource = file.name;
  }

  async function importTranscriptFile(value: File | File[] | null) {
    const file = firstInputFile(value);
    if (!file) {
      return;
    }
    editForm.transcriptText = await file.text();
    editForm.transcriptSource = file.name;
  }

  function buildUpdatePayload(status?: Sermon["status"]): UpdateSermonRequest {
    return {
      sourceLocale: editForm.sourceLocale,
      title: editForm.title.trim(),
      speaker: editForm.speaker.trim(),
      sermonDate: editForm.sermonDate.trim(),
      series: blankToNull(editForm.series),
      topics: cleanTopics(editForm.topics),
      primaryReference: blankToNull(editForm.primaryReference),
      summary: blankToNull(editForm.summary),
      ...(status ? { status } : {}),
      outline: cleanedOutline.value,
      references: cleanedReferences.value,
      transcript: editForm.transcriptText.trim()
        ? {
            text: editForm.transcriptText.trim(),
            source: blankToNull(editForm.transcriptSource),
            updatedAt: null
          }
        : null,
      reviewMarkdown: blankToNull(editForm.reviewMarkdown)
    };
  }

  function addOutlineItem() {
    const previous = editForm.outline[editForm.outline.length - 1];
    editForm.outline.push({
      title: "",
      startSeconds: previous ? previous.startSeconds + 300 : 0,
      summary: ""
    });
  }

  function removeOutlineItem(index: number) {
    editForm.outline.splice(index, 1);
  }

  function moveOutlineItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= editForm.outline.length) {
      return;
    }
    const [item] = editForm.outline.splice(index, 1);
    if (item) {
      editForm.outline.splice(targetIndex, 0, item);
    }
  }

  function addReference() {
    editForm.references.push({
      reference: "",
      verseId: "",
      note: "",
      startSeconds: null
    });
  }

  function removeReference(index: number) {
    editForm.references.splice(index, 1);
  }

  return {
    editForm,
    manualSermonForm,
    selectedManualManuscriptFile,
    selectedTranscriptFile,
    reviewChecks,
    isReviewReady,
    canCreateManualSermon,
    cleanedOutline,
    cleanedReferences,
    cleanedManualTopics,
    applySermonToDetail,
    resetManualSermonForm,
    importManualManuscriptFile,
    importTranscriptFile,
    buildUpdatePayload,
    addOutlineItem,
    removeOutlineItem,
    moveOutlineItem,
    addReference,
    removeReference,
    blankToNull
  };
}

function firstInputFile(value: File | File[] | null) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

function blankToNull(value: string): string | null {
  const clean = value.trim();
  return clean ? clean : null;
}

function cleanTopics(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
