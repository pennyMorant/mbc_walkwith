import type {
  AdminPermission,
  LifePost,
  LifePostStatus,
  LifePostUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, type QueryClient } from "@tanstack/vue-query";
import { computed, ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";

import {
  archiveLifePost,
  createLifePost,
  deleteLifePost,
  publishLifePost,
  returnLifePostDraft,
  submitLifePostReview,
  unpublishLifePost,
  updateLifePost
} from "@/core/api/life_posts";
import {
  buildLifePostPayload,
  buildLifePostPublishRequest,
  isLifePostCommandCurrent,
  type LifePostCommandContext,
  type LifePostEditorForm
} from "../life_post_editor_models";

type Input = {
  queryClient: QueryClient;
  selectedPost: Ref<LifePost | null>;
  form: LifePostEditorForm;
  statusForSave: () => LifePostStatus | null;
  canSave: () => boolean;
  isPublishReady: () => boolean;
  can: (permission: AdminPermission) => boolean;
  t: (key: string) => string;
  openPost: (post: LifePost) => void;
  afterDelete: () => void;
  showToast: (message: string, color?: string) => void;
  editorSessionId: Ref<number>;
};

type LifePostCommandIntent = LifePostCommandContext;

export function useLifePostMutations(input: Input) {
  const commandErrorMessage = ref("");
  const createMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (
      intent: LifePostCommandIntent & { payload: LifePostUpsertRequest }
    ) => createLifePost(intent.payload),
    onSuccess: (post, intent) =>
      mutationSucceeded(post, intent, "Life post created."),
    onError: captureCommandError
  });

  const updateMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (intent: LifePostCommandIntent & {
      postId: string;
      revision: number;
      payload: ReturnType<typeof buildLifePostPayload>;
    }) => updateLifePost(intent.postId, intent.revision, intent.payload),
    onSuccess: (post, intent) =>
      mutationSucceeded(post, intent, "Life post saved."),
    onError: captureCommandError
  });

  const publishMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (intent: LifePostCommandIntent & {
      postId: string;
      revision: number;
      request: ReturnType<typeof buildLifePostPublishRequest>;
    }) => publishLifePost(intent.postId, intent.revision, intent.request),
    onSuccess: (post, intent) =>
      mutationSucceeded(post, intent, "Life post published."),
    onError: captureCommandError
  });

  const submitReviewMutation = statusMutation(
    submitLifePostReview,
    "Life post submitted for review."
  );
  const returnDraftMutation = statusMutation(
    returnLifePostDraft,
    "Life post returned to draft."
  );
  const archiveMutation = statusMutation(
    archiveLifePost,
    "Life post archived."
  );
  const unpublishMutation = statusMutation(
    unpublishLifePost,
    "Life post unpublished."
  );

  const deleteMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (
      intent: LifePostCommandIntent & { postId: string; revision: number }
    ) => deleteLifePost(intent.postId, intent.revision),
    onSuccess: async (_result, intent) => {
      if (isCurrentIntent(intent)) {
        input.afterDelete();
        input.showToast(input.t("Life post deleted."));
      }
      await invalidatePosts();
    },
    onError: captureCommandError
  });

  const commandPending = computed(() =>
    [
      createMutation,
      updateMutation,
      publishMutation,
      submitReviewMutation,
      returnDraftMutation,
      archiveMutation,
      unpublishMutation,
      deleteMutation
    ].some((mutation) => mutation.isPending.value)
  );

  function saveLifePost() {
    const post = input.selectedPost.value;
    if (
      commandPending.value ||
      !input.canSave() ||
      !input.can("life_posts:update") ||
      (post?.status === "published" && !input.can("life_posts:publish"))
    ) {
      return;
    }
    const payload = buildLifePostPayload(input.form, input.statusForSave());
    if (post) {
      updateMutation.mutate({
        editorSessionId: input.editorSessionId.value,
        postId: post.id,
        revision: post.revision,
        payload
      });
      return;
    }
    createMutation.mutate({
      editorSessionId: input.editorSessionId.value,
      postId: null,
      payload: payload as LifePostUpsertRequest
    });
  }

  function submitCurrentLifePostReview() {
    mutateIfAllowed(submitReviewMutation);
  }

  function returnLifePostToDraft() {
    mutateIfAllowed(returnDraftMutation);
  }

  function publishCurrentLifePost() {
    const post = input.selectedPost.value;
    if (
      !post ||
      commandPending.value ||
      !input.can("life_posts:publish") ||
      !input.isPublishReady()
    ) {
      return;
    }
    const canUpdate = input.can("life_posts:update");
    publishMutation.mutate({
      postId: post.id,
      editorSessionId: input.editorSessionId.value,
      revision: post.revision,
      request: buildLifePostPublishRequest(
        input.form,
        canUpdate ? buildLifePostPayload(input.form, null) : undefined
      )
    });
  }

  function unpublishCurrentLifePost() {
    const post = input.selectedPost.value;
    if (commandPending.value || !post || !input.can("life_posts:publish")) {
      return;
    }
    unpublishMutation.mutate(intentFor(post, input.editorSessionId.value));
  }

  function archiveCurrentLifePost() {
    mutateIfAllowed(archiveMutation);
  }

  function deleteCurrentLifePost() {
    const post = input.selectedPost.value;
    if (commandPending.value || !canUpdate(post)) {
      return;
    }
    deleteMutation.mutate(intentFor(post, input.editorSessionId.value));
  }

  function statusMutation(
    mutation: (postId: string, revision: number) => Promise<LifePost>,
    successKey: string
  ) {
    return useMutation({
      onMutate: clearCommandError,
      mutationFn: (
        intent: LifePostCommandIntent & { postId: string; revision: number }
      ) => mutation(intent.postId, intent.revision),
      onSuccess: (post, intent) => mutationSucceeded(post, intent, successKey),
      onError: captureCommandError
    });
  }

  function mutateIfAllowed(
    mutation: ReturnType<typeof statusMutation>
  ) {
    const post = input.selectedPost.value;
    if (commandPending.value || !canUpdate(post)) {
      return;
    }
    mutation.mutate(intentFor(post, input.editorSessionId.value));
  }

  function canUpdate(post: LifePost | null): post is LifePost {
    return Boolean(
      post &&
        input.can("life_posts:update") &&
        (post.status !== "published" || input.can("life_posts:publish"))
    );
  }

  async function mutationSucceeded(
    post: LifePost,
    intent: LifePostCommandIntent,
    successKey: string
  ) {
    if (isCurrentIntent(intent)) {
      input.openPost(post);
      input.showToast(input.t(successKey));
    }
    await invalidatePosts();
  }

  function isCurrentIntent(intent: LifePostCommandIntent) {
    return isLifePostCommandCurrent(
      intent,
      input.editorSessionId.value,
      input.selectedPost.value?.id ?? null
    );
  }

  function clearCommandError(intent: LifePostCommandIntent) {
    if (isCurrentIntent(intent)) commandErrorMessage.value = "";
  }

  function captureCommandError(
    error: unknown,
    intent: LifePostCommandIntent
  ) {
    if (isCurrentIntent(intent)) {
      commandErrorMessage.value = formatApiErrorMessage(
        error,
        input.t("common.error")
      );
    }
  }

  function resetCommandFeedback() {
    commandErrorMessage.value = "";
  }

  function invalidatePosts() {
    return input.queryClient.invalidateQueries({ queryKey: ["life-posts"] });
  }

  return {
    createMutation,
    updateMutation,
    publishMutation,
    submitReviewMutation,
    returnDraftMutation,
    archiveMutation,
    unpublishMutation,
    deleteMutation,
    commandErrorMessage,
    commandPending,
    resetCommandFeedback,
    saveLifePost,
    submitCurrentLifePostReview,
    returnLifePostToDraft,
    publishCurrentLifePost,
    unpublishCurrentLifePost,
    archiveCurrentLifePost,
    deleteCurrentLifePost
  };
}

function intentFor(post: LifePost, editorSessionId: number) {
  return { editorSessionId, postId: post.id, revision: post.revision };
}
