import type { LifePost, LifePostStatus } from "@mbc/api-contracts";
import { computed, type Ref } from "vue";

import {
  isLifePostCtaUrlValid,
  isLifePostScheduleValid,
  type LifePostEditorForm
} from "../life_post_editor_models";

export function useLifePostEditorValidation(input: {
  form: LifePostEditorForm;
  selectedPost: Ref<LifePost | null>;
  t: (key: string) => string;
}) {
  const isScheduleValid = computed(() => isLifePostScheduleValid(input.form));
  const isCtaUrlValid = computed(() => isLifePostCtaUrlValid(input.form));
  const canSave = computed(
    () =>
      input.form.type.trim().length > 0 &&
      input.form.title.trim().length > 0 &&
      isScheduleValid.value &&
      isCtaUrlValid.value &&
      (input.form.status !== "published" ||
        input.selectedPost.value?.status === "published")
  );
  const publishReadinessChecks = computed(() => [
    {
      label: input.t("Title"),
      detail: input.t("Title is required."),
      ok: input.form.title.trim().length > 0
    },
    {
      label: input.t("Body"),
      detail: input.t("Body is required before publishing."),
      ok: input.form.body.trim().length > 0
    },
    {
      label: input.t("Visibility"),
      detail: input.t("Published life posts must be public or members visible."),
      ok: ["public", "members"].includes(input.form.visibility)
    },
    {
      label: input.t("Schedule"),
      detail: input.t("End time must be after start time."),
      ok: isScheduleValid.value
    },
    {
      label: input.t("Action URL"),
      detail: input.t("Action URL must start with http or https."),
      ok: isCtaUrlValid.value
    }
  ]);
  const isPublishReady = computed(() =>
    publishReadinessChecks.value.every((check) => check.ok)
  );
  const statusForSave = computed<LifePostStatus | null>(() =>
    input.form.status === "published" ? null : input.form.status
  );

  return {
    canSave,
    isScheduleValid,
    isCtaUrlValid,
    publishReadinessChecks,
    isPublishReady,
    statusForSave
  };
}
