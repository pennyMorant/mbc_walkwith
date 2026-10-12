import type { Sermon } from "@mbc/api-contracts";

export type SermonPipelineStepState =
  | "ready"
  | "queued"
  | "failed"
  | "missing"
  | "blocked";

export type SermonPipelineActionId =
  | "open_audio"
  | "open_transcript"
  | "open_outline"
  | "open_references"
  | "save_review"
  | "save_publish";

export type SermonPipelineAction = {
  id: SermonPipelineActionId;
  label: string;
  color: string;
  loading: boolean;
  disabled: boolean;
  disabledReason?: string;
};

export type SermonPipelineStep = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  state: SermonPipelineStepState;
  stateLabel: string;
  color: string;
  icon: string;
  action: SermonPipelineAction | null;
};

export type SermonPipelineStepInput = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  ready: boolean;
  action: SermonPipelineAction | null;
  icon: string;
  missingLabel: string;
  blockedLabel: string;
  failed?: boolean;
  blocked?: boolean;
};

type Translate = (key: string) => string;

export function buildSermonPipelineStep(
  input: SermonPipelineStepInput,
  t: Translate
): SermonPipelineStep {
  if (input.ready) {
    return {
      id: input.id,
      title: input.title,
      subtitle: input.subtitle,
      detail: input.detail,
      state: "ready",
      stateLabel: t("Ready"),
      color: "success",
      icon: input.icon,
      action: input.action
    };
  }
  if (input.failed) {
    return {
      id: input.id,
      title: input.title,
      subtitle: input.subtitle,
      detail: input.detail,
      state: "failed",
      stateLabel: t("Failed"),
      color: "error",
      icon: input.icon,
      action: input.action
    };
  }
  if (input.blocked) {
    return {
      id: input.id,
      title: input.title,
      subtitle: input.subtitle,
      detail: input.detail,
      state: "blocked",
      stateLabel: input.blockedLabel,
      color: "secondary",
      icon: input.icon,
      action: input.action
    };
  }
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    detail: input.detail,
    state: "missing",
    stateLabel: input.missingLabel,
    color: "grey",
    icon: input.icon,
    action: input.action
  };
}

export function sermonStatusColor(status: Sermon["status"]) {
  return {
    draft: "grey",
    processing: "info",
    needs_review: "warning",
    published: "success",
    archived: "secondary",
    failed: "error"
  }[status];
}

export function formatSermonFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}
