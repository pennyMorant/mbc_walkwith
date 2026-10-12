import type {
  AdminPermission,
  LifePost,
  LifePostStatus,
  LifePostUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, type QueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";

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
};

export function useLifePostMutations(input: Input) {
  const createMutation = useMutation({
    mutationFn: (payload: LifePostUpsertRequest) => createLifePost(payload),
    onSuccess: (post) => mutationSucceeded(post, "Life post created.")
  });

  const updateMutation = useMutation({
    mutationFn: (intent: {
      postId: string;
      revision: number;
      payload: ReturnType<typeof buildLifePostPayload>;
    }) => updateLifePost(intent.postId, intent.revision, intent.payload),
    onSuccess: (post) => mutationSucceeded(post, "Life post saved.")
  });

  const publishMutation = useMutation({
    mutationFn: (intent: {
      postId: string;
      revision: number;
      request: ReturnType<typeof buildLifePostPublishRequest>;
    }) => publishLifePost(intent.postId, intent.revision, intent.request),
    onSuccess: (post) => mutationSucceeded(post, "Life post published.")
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
    mutationFn: (intent: { postId: string; revision: number }) =>
      deleteLifePost(intent.postId, intent.revision),
    onSuccess: async () => {
      input.afterDelete();
      await invalidatePosts();
      input.showToast(input.t("Life post deleted."));
    }
  });

  function saveLifePost() {
    const post = input.selectedPost.value;
    if (
      !input.canSave() ||
      !input.can("life_posts:update") ||
      (post?.status === "published" && !input.can("life_posts:publish"))
    ) {
      return;
    }
    const payload = buildLifePostPayload(input.form, input.statusForSave());
    if (post) {
      updateMutation.mutate({
        postId: post.id,
        revision: post.revision,
        payload
      });
      return;
    }
    createMutation.mutate(payload as LifePostUpsertRequest);
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
      !input.can("life_posts:publish") ||
      !input.isPublishReady()
    ) {
      return;
    }
    const canUpdate = input.can("life_posts:update");
    publishMutation.mutate({
      postId: post.id,
      revision: post.revision,
      request: buildLifePostPublishRequest(
        input.form,
        canUpdate ? buildLifePostPayload(input.form, null) : undefined
      )
    });
  }

  function unpublishCurrentLifePost() {
    const post = input.selectedPost.value;
    if (!post || !input.can("life_posts:publish")) {
      return;
    }
    unpublishMutation.mutate(intentFor(post));
  }

  function archiveCurrentLifePost() {
    mutateIfAllowed(archiveMutation);
  }

  function deleteCurrentLifePost() {
    const post = input.selectedPost.value;
    if (!canUpdate(post)) {
      return;
    }
    deleteMutation.mutate(intentFor(post));
  }

  function statusMutation(
    mutation: (postId: string, revision: number) => Promise<LifePost>,
    successKey: string
  ) {
    return useMutation({
      mutationFn: (intent: { postId: string; revision: number }) =>
        mutation(intent.postId, intent.revision),
      onSuccess: (post) => mutationSucceeded(post, successKey)
    });
  }

  function mutateIfAllowed(
    mutation: ReturnType<typeof statusMutation>
  ) {
    const post = input.selectedPost.value;
    if (!canUpdate(post)) {
      return;
    }
    mutation.mutate(intentFor(post));
  }

  function canUpdate(post: LifePost | null): post is LifePost {
    return Boolean(
      post &&
        input.can("life_posts:update") &&
        (post.status !== "published" || input.can("life_posts:publish"))
    );
  }

  async function mutationSucceeded(post: LifePost, successKey: string) {
    input.openPost(post);
    await invalidatePosts();
    input.showToast(input.t(successKey));
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
    saveLifePost,
    submitCurrentLifePostReview,
    returnLifePostToDraft,
    publishCurrentLifePost,
    unpublishCurrentLifePost,
    archiveCurrentLifePost,
    deleteCurrentLifePost
  };
}

function intentFor(post: LifePost) {
  return { postId: post.id, revision: post.revision };
}
