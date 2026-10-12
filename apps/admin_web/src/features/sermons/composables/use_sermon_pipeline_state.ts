import type {
  Sermon,
  SermonOutlineItem,
  SermonReference
} from "@mbc/api-contracts";
import { computed, type ComputedRef, type Ref } from "vue";

import {
  buildSermonPipelineStep,
  formatSermonFileSize,
  type SermonPipelineStep,
  type SermonPipelineStepInput
} from "../sermon_pipeline";

type Translate = (key: string) => string;
type PermissionReader = { can(permission: string): boolean };
type PendingMutation = { isPending: Ref<boolean> };

type SermonEditForm = {
  title: string;
  speaker: string;
  sermonDate: string;
  summary: string;
  transcriptText: string;
  transcriptSource: string;
};

type ReviewCheck = {
  label: string;
  ok: boolean;
  detail: string;
};

type UseSermonPipelineStateInput = {
  selectedSermon: Ref<Sermon | null>;
  editForm: SermonEditForm;
  authStore: PermissionReader;
  t: Translate;
  cleanedOutline: ComputedRef<SermonOutlineItem[]>;
  cleanedReferences: ComputedRef<SermonReference[]>;
  reviewChecks: ComputedRef<ReviewCheck[]>;
  isReviewReady: ComputedRef<boolean>;
  saveAndReviewPending: Ref<boolean>;
  saveAndPublishPending: Ref<boolean>;
};

export function useSermonPipelineState(input: UseSermonPipelineStateInput) {
  const {
    selectedSermon,
    editForm,
    authStore,
    t,
    cleanedOutline,
    cleanedReferences,
    reviewChecks,
    isReviewReady
  } = input;
  const saveAndReviewMutation = pendingMutation(input.saveAndReviewPending);
  const saveAndPublishMutation = pendingMutation(input.saveAndPublishPending);
  const formatFileSize = formatSermonFileSize;

  function buildPipelineStep(input: SermonPipelineStepInput): SermonPipelineStep {
    return buildSermonPipelineStep(input, t);
  }

  const sermonPipelineSteps = computed<SermonPipelineStep[]>(() => {
    const sermon = selectedSermon.value;
    if (!sermon) {
      return [];
    }
  
    const metadataReady = Boolean(
      editForm.title.trim() &&
        editForm.speaker.trim() &&
        editForm.sermonDate.trim()
    );
    const audioReady = sermon.audio.status === "ready";
    const transcriptReady = Boolean(editForm.transcriptText.trim());
    const outlineReady = cleanedOutline.value.length > 0;
    const scriptureReady = cleanedReferences.value.length > 0;
    const reviewReady = isReviewReady.value;
  
    return [
      buildPipelineStep({
        id: "metadata",
        title: t("Metadata"),
        subtitle: t("Manual sermon record"),
        detail: [
          editForm.title.trim() || t("No title"),
          editForm.speaker.trim() || t("No speaker"),
          editForm.sermonDate.trim() || t("No date")
        ].join(" · "),
        ready: metadataReady,
        missingLabel: t("Incomplete"),
        blockedLabel: t("Incomplete"),
        action: null,
        icon: "mdi-card-text-outline"
      }),
      buildPipelineStep({
        id: "audio",
        title: t("Audio"),
        subtitle:
          sermon.audio.status === "ready"
            ? sermon.audio.fileName || t("Audio ready")
            : t("Audio is required for app playback"),
        detail:
          sermon.audio.status === "ready"
            ? [
                sermon.audio.mimeType || t("unknown type"),
                formatFileSize(sermon.audio.sizeBytes)
              ].join(" · ")
            : t(sermon.audio.status),
        ready: audioReady,
        failed: sermon.audio.status === "failed",
        missingLabel: t("Missing"),
        blockedLabel: t("Missing"),
        action: audioReady
          ? null
          : {
              id: "open_audio",
              label: t("Upload audio"),
              color: "primary",
              loading: false,
              disabled: !authStore.can("sermons:update"),
              disabledReason: t("Sermon update access required")
            },
        icon: "mdi-music-note"
      }),
      buildPipelineStep({
        id: "transcript",
        title: t("Transcript"),
        subtitle: transcriptReady
          ? `${editForm.transcriptText.trim().length} ${t("characters")}`
          : t("Upload reviewed local transcript"),
        detail: editForm.transcriptSource.trim() || t("No transcript source"),
        ready: transcriptReady,
        missingLabel: t("Missing"),
        blockedLabel: t("Missing"),
        action: transcriptReady
          ? null
          : {
              id: "open_transcript",
              label: t("Edit transcript"),
              color: "info",
              loading: false,
              disabled: !authStore.can("sermons:update"),
              disabledReason: t("Sermon update access required")
            },
        icon: "mdi-text-recognition"
      }),
      buildPipelineStep({
        id: "outline",
        title: t("Outline"),
        subtitle: outlineReady
          ? `${cleanedOutline.value.length} ${t("sermons.reviewMetric.sections")}`
          : t("Add reviewed local outline"),
        detail:
          cleanedOutline.value
            .map((item) => item.title)
            .slice(0, 2)
            .join(" · ") || t("No outline sections"),
        ready: outlineReady,
        missingLabel: t("Missing"),
        blockedLabel: t("Missing"),
        action: outlineReady
          ? null
          : {
              id: "open_outline",
              label: t("Edit outline"),
              color: "info",
              loading: false,
              disabled: !authStore.can("sermons:update"),
              disabledReason: t("Sermon update access required")
            },
        icon: "mdi-format-list-bulleted"
      }),
      buildPipelineStep({
        id: "scripture",
        title: t("Scripture"),
        subtitle: scriptureReady
          ? `${cleanedReferences.value.length} ${t("sermons.reviewMetric.references")}`
          : t("Add reviewed Scripture references"),
        detail:
          cleanedReferences.value
            .map((reference) => reference.reference)
            .slice(0, 3)
            .join(" · ") || t("No Scripture references"),
        ready: scriptureReady,
        missingLabel: t("Missing"),
        blockedLabel: t("Missing"),
        action: scriptureReady
          ? null
          : {
              id: "open_references",
              label: t("Edit references"),
              color: "info",
              loading: false,
              disabled: !authStore.can("sermons:update"),
              disabledReason: t("Sermon update access required")
            },
        icon: "mdi-book-open-page-variant-outline"
      }),
      {
        id: "review",
        title: t("Review and publish"),
        subtitle:
          sermon.status === "published"
            ? t("Published to app")
            : sermon.status === "needs_review"
              ? t("Waiting for publisher")
              : reviewReady
                ? t("Ready for review")
                : t("Checklist incomplete"),
        detail: reviewChecks.value
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join(" · ") || t("All required sermon content is present"),
        state:
          sermon.status === "published"
            ? "ready"
            : sermon.status === "needs_review"
              ? "queued"
              : reviewReady
                ? "missing"
                : "blocked",
        stateLabel:
          sermon.status === "published"
            ? t("Published")
            : sermon.status === "needs_review"
              ? t("In review")
              : reviewReady
                ? t("Ready")
                : t("Blocked"),
        color:
          sermon.status === "published"
            ? "success"
            : sermon.status === "needs_review"
              ? "warning"
              : reviewReady
                ? "info"
                : "secondary",
        icon:
          sermon.status === "published"
            ? "mdi-check-decagram-outline"
            : "mdi-clipboard-check-outline",
        action:
          sermon.status === "published"
            ? null
            : sermon.status === "needs_review"
              ? {
                  id: "save_publish",
                  label: t("Publish"),
                  color: "success",
                  loading: saveAndPublishMutation.isPending.value,
                  disabled:
                    saveAndPublishMutation.isPending.value ||
                    !authStore.can("sermons:publish") ||
                    !reviewReady,
                  disabledReason: reviewReady
                    ? t("Publish access required")
                    : t("Checklist must be complete")
                }
              : {
                  id: "save_review",
                  label: t("Save for review"),
                  color: "warning",
                  loading: saveAndReviewMutation.isPending.value,
                  disabled:
                    saveAndReviewMutation.isPending.value ||
                    !authStore.can("sermons:update") ||
                    !reviewReady,
                  disabledReason: reviewReady
                    ? t("Sermon update access required")
                    : t("Checklist must be complete")
                }
      }
    ];
  });
  const sermonPipelineProgress = computed(() => {
    if (sermonPipelineSteps.value.length === 0) {
      return 0;
    }
    const completed = sermonPipelineSteps.value.filter(
      (step) => step.state === "ready"
    ).length;
    return Math.round((completed / sermonPipelineSteps.value.length) * 100);
  });
  const nextSermonPipelineStep = computed(
    () => sermonPipelineSteps.value.find((step) => step.state !== "ready") ?? null
  );

  return {
    sermonPipelineSteps,
    sermonPipelineProgress,
    nextSermonPipelineStep
  };
}

function pendingMutation(isPending: Ref<boolean>): PendingMutation {
  return { isPending };
}
