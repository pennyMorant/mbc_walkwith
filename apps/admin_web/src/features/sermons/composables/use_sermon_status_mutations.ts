import type { Sermon, UpdateSermonRequest } from "@mbc/api-contracts";
import { useMutation } from "@tanstack/vue-query";
import type { Ref } from "vue";

import {
  archiveAdminSermon,
  deleteAdminSermon,
  markAdminSermonFailed,
  publishAdminSermon,
  returnAdminSermonDraft,
  submitAdminSermonReview,
  updateAdminSermon
} from "@/core/api/sermons";
import {
  isCurrentSermonIntent,
  sameSermonUpdateIntent,
  type SermonCommandIntent,
  type SermonUpdateIntent
} from "../sermon_mutation_models";

type PermissionReader = { can(permission: string): boolean };
type Translate = (key: string) => string;

type UseSermonStatusMutationsInput = {
  selectedSermon: Ref<Sermon | null>;
  detailDrawer: Ref<boolean>;
  authStore: PermissionReader;
  t: Translate;
  buildUpdatePayload: (status?: Sermon["status"]) => UpdateSermonRequest;
  applySermonResult: (sermon: Sermon, replaceEditor?: boolean) => boolean;
  refreshList: () => void;
};

export function useSermonStatusMutations(
  input: UseSermonStatusMutationsInput
) {
  const {
    selectedSermon,
    detailDrawer,
    authStore,
    t,
    buildUpdatePayload,
    applySermonResult,
    refreshList
  } = input;

  function requireUpdateAccess() {
    if (!authStore.can("sermons:update")) {
      throw new Error(t("Sermon update access required"));
    }
  }

  function requirePublishAccess() {
    if (!authStore.can("sermons:publish")) {
      throw new Error(t("Publish access required"));
    }
  }

  function applyCommandResult(sermon: Sermon, intent: SermonCommandIntent) {
    if (isCurrentSermonIntent(selectedSermon.value, intent)) {
      applySermonResult(sermon, false);
    }
    refreshList();
  }

  function applyUpdateResult(
    sermon: Sermon,
    intent: SermonUpdateIntent,
    status: Sermon["status"]
  ) {
    applySermonResult(
      sermon,
      sameSermonUpdateIntent(
        selectedSermon.value,
        buildUpdatePayload(status),
        intent
      )
    );
    refreshList();
  }

  const publishMutation = useMutation({
    mutationFn: (intent: SermonCommandIntent) => {
      requirePublishAccess();
      return publishAdminSermon(intent.sermonId, intent.revision);
    },
    onSuccess: applyCommandResult
  });

  const saveAndReviewMutation = useMutation({
    mutationFn: (intent: SermonUpdateIntent) => {
      requireUpdateAccess();
      return updateAdminSermon(
        intent.sermonId,
        intent.revision,
        intent.payload
      );
    },
    onSuccess: (sermon, intent) =>
      applyUpdateResult(sermon, intent, "needs_review")
  });

  const saveAndPublishMutation = useMutation({
    mutationFn: (intent: SermonUpdateIntent) => {
      requireUpdateAccess();
      requirePublishAccess();
      return updateAdminSermon(
        intent.sermonId,
        intent.revision,
        intent.payload
      );
    },
    onSuccess: (sermon, intent) =>
      applyUpdateResult(sermon, intent, "published")
  });

  const submitReviewMutation = commandMutation(
    submitAdminSermonReview,
    requireUpdateAccess,
    applyCommandResult
  );
  const returnDraftMutation = commandMutation(
    returnAdminSermonDraft,
    requireUpdateAccess,
    applyCommandResult
  );
  const markFailedMutation = commandMutation(
    markAdminSermonFailed,
    requireUpdateAccess,
    applyCommandResult
  );
  const archiveMutation = commandMutation(
    archiveAdminSermon,
    requireUpdateAccess,
    applyCommandResult
  );

  const deleteMutation = useMutation({
    mutationFn: async (intent: SermonCommandIntent) => {
      requireUpdateAccess();
      await deleteAdminSermon(intent.sermonId, intent.revision);
    },
    onSuccess: (_result, intent) => {
      if (isCurrentSermonIntent(selectedSermon.value, intent)) {
        selectedSermon.value = null;
        detailDrawer.value = false;
      }
      refreshList();
    }
  });

  return {
    archiveMutation,
    deleteMutation,
    markFailedMutation,
    publishMutation,
    returnDraftMutation,
    saveAndPublishMutation,
    saveAndReviewMutation,
    submitReviewMutation
  };
}

function commandMutation(
  command: (sermonId: string, revision: number) => Promise<Sermon>,
  assertAccess: () => void,
  onSuccess: (sermon: Sermon, intent: SermonCommandIntent) => void
) {
  return useMutation({
    mutationFn: (intent: SermonCommandIntent) => {
      assertAccess();
      return command(intent.sermonId, intent.revision);
    },
    onSuccess
  });
}
