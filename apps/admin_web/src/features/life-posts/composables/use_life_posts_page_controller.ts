import type { LifePost, LifePostStatus, LifePostVisibility } from "@mbc/api-contracts";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listLifePosts } from "@/core/api/life_posts";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatDateTime,
  formatLifePostSchedule,
  datetimeLocalFromIso,
  lifePostIconLabel,
  lifePostStatusColor,
  lifePostVisibilityColor,
  nullableTrimmed
} from "../life_post_presenters";
import { buildLifePostPreview, createLifePostEditorForm } from "../life_post_editor_models";
import { useLifeEventRegistrations } from "./use_life_event_registrations";
import { useLifePostMutations } from "./use_life_post_mutations";
import { useLifePostAiDrafts } from "./use_life_post_ai_drafts";
import { useLifePostConfirmActions } from "./use_life_post_confirm_actions";
import { useLifePostEditorValidation } from "./use_life_post_editor_validation";
import { useLifePostImageState } from "./use_life_post_image_state";

export function useLifePostsPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedPost = ref<LifePost | null>(null);
  const drawer = ref(false);
  const snackbar = reactive({
    show: false,
    message: "",
    color: "success"
  });
  const lifePostTypes = [
    "weekly_bulletin",
    "sunday",
    "announcement",
    "fellowship",
    "prayer",
    "giving",
    "service_opportunity"
  ];
  const lifePostIcons = ["church", "groups", "prayer", "giving", "meal", "event"];
  const displayWeightOptions = computed(() => [
    { title: t("life.displayWeight.normal"), value: 0 },
    { title: t("life.displayWeight.important"), value: 50 },
    { title: t("life.displayWeight.veryImportant"), value: 100 }
  ]);
  
  const filters = reactive({
    query: "",
    visibility: "" as LifePostVisibility | "",
    status: "" as LifePostStatus | ""
  });
  
  const form = reactive(createLifePostEditorForm());
  
  const {
    registrationFilters,
    registrationPage,
    registrationPageCount,
    registrationTotal,
    registrationErrorMessage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog,
    registrationsQuery,
    registrations,
    exportRegistrationsMutation,
    createRegistrationMutation,
    createCheckInCodeMutation,
    updateRegistrationStatusMutation,
    updateRegistrationMutation,
    applyRegistrationFilters,
    setRegistrationPage,
    openRegistrationEditor,
    openRegistrationCreator,
    closeCheckInCodeDialog,
    resetRegistrationWorkspace
  } = useLifeEventRegistrations({
    selectedPost,
    canManage: computed(() => authStore.can("life_posts:update")),
    queryClient,
    t,
    showToast,
    nullableTrimmed,
    syncSelectedPostFromList
  });

  const {
    imagePreviewUrl,
    uploadImageMutation,
    imageUploadErrorMessage,
    uploadSelectedImage,
    clearImage
  } = useLifePostImageState({
    form,
    t,
    showToast,
    nullableTrimmed
  });

  const {
    lifePostAiInput,
    notificationAiInput,
    lifePostAiResource,
    applyLifePostAiDraft,
    applyNotificationAiDraft
  } = useLifePostAiDrafts({
    form,
    selectedPost,
    t,
    showToast
  });
  
  const activeFilters = computed(() => ({ ...filters, limit: 50 }));
  const postsQuery = useQuery({
    queryKey: ["life-posts", activeFilters],
    queryFn: () => listLifePosts(activeFilters.value)
  });
  
  const posts = computed(() => postsQuery.data.value ?? []);
  const publicPostCount = computed(
    () => posts.value.filter((post) => post.status === "published").length
  );
  const privatePostCount = computed(
    () => posts.value.filter((post) => post.status !== "published").length
  );
  const previewPost = computed(() =>
    buildLifePostPreview(form, selectedPost.value, t)
  );
  
  const {
    canSave,
    isScheduleValid,
    isCtaUrlValid,
    publishReadinessChecks,
    isPublishReady,
    statusForSave
  } = useLifePostEditorValidation({ form, selectedPost, t });

  const {
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
  } = useLifePostMutations({
    queryClient,
    selectedPost,
    form,
    statusForSave: () => statusForSave.value,
    canSave: () => canSave.value,
    isPublishReady: () => isPublishReady.value,
    can: (permission) => authStore.can(permission),
    t,
    openPost,
    afterDelete: () => {
      selectedPost.value = null;
      drawer.value = false;
      resetRegistrationWorkspace();
      resetForm();
    },
    showToast
  });

  const { confirmDialog, requestArchive, requestDelete, confirmPendingAction } =
    useLifePostConfirmActions({
      t,
      archive: archiveCurrentLifePost,
      deletePost: deleteCurrentLifePost
    });
  
  const lifePostMutationErrorMessage = computed(() =>
    formatApiErrorMessage(
      createMutation.error.value ||
        updateMutation.error.value ||
        submitReviewMutation.error.value ||
        returnDraftMutation.error.value ||
        publishMutation.error.value ||
        unpublishMutation.error.value ||
        archiveMutation.error.value ||
        uploadImageMutation.error.value ||
        deleteMutation.error.value,
      t("common.error")
    )
  );
  
  function openPost(post: LifePost) {
    resetRegistrationWorkspace();
    selectedPost.value = post;
    form.sourceLocale = post.sourceLocale;
    form.type = post.type;
    form.title = post.title;
    form.body = post.body;
    form.meta = post.meta;
    form.iconName = post.iconName;
    form.startsAt = datetimeLocalFromIso(post.startsAt);
    form.endsAt = datetimeLocalFromIso(post.endsAt);
    form.visibility = post.visibility;
    form.imageUrl = post.imageUrl ?? "";
    form.displayWeight = post.displayWeight;
    form.ctaLabel = post.ctaLabel ?? "";
    form.ctaUrl = post.ctaUrl ?? "";
    form.registrationEnabled = post.registrationEnabled;
    form.registrationCapacity = post.registrationCapacity;
    form.registrationDeadline = datetimeLocalFromIso(post.registrationDeadline);
    form.registrationAllowCancellation = post.registrationAllowCancellation;
    form.registrationMaxPartySize = post.registrationMaxPartySize;
    form.notifyAppOnPublish = false;
    form.notificationTitle = "";
    form.notificationBody = "";
    form.notificationTranslations = createLifePostEditorForm().notificationTranslations;
    form.status = post.status;
    drawer.value = true;
  }
  
  function newPost() {
    resetRegistrationWorkspace();
    selectedPost.value = null;
    resetForm();
    drawer.value = true;
  }
  
  function resetForm() {
    Object.assign(form, createLifePostEditorForm());
  }
  
  const statusColor = lifePostStatusColor;
  const visibilityColor = lifePostVisibilityColor;

  function iconLabel(iconName: string) {
    return lifePostIconLabel(iconName, t);
  }
  
  function formatSchedule(post: LifePost) {
    return formatLifePostSchedule(post, t);
  }
  
  function showToast(message: string, color = "success") {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
  }

  function syncSelectedPostFromList() {
    const currentPostId = selectedPost.value?.id;
    if (!currentPostId) {
      return;
    }
    const refreshedPost = posts.value.find((post) => post.id === currentPostId);
    if (refreshedPost) {
      selectedPost.value = refreshedPost;
    }
  }

  return {
    authStore,
    optionItems,
    t,
    selectedPost,
    drawer,
    snackbar,
    confirmDialog,
    lifePostTypes,
    lifePostIcons,
    displayWeightOptions,
    filters,
    form,
    registrationFilters,
    registrationPage,
    registrationPageCount,
    registrationTotal,
    registrationErrorMessage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog,
    postsQuery,
    registrationsQuery,
    createMutation,
    updateMutation,
    publishMutation,
    submitReviewMutation,
    returnDraftMutation,
    archiveMutation,
    unpublishMutation,
    deleteMutation,
    exportRegistrationsMutation,
    createRegistrationMutation,
    createCheckInCodeMutation,
    updateRegistrationStatusMutation,
    updateRegistrationMutation,
    posts,
    registrations,
    canSave,
    publicPostCount,
    privatePostCount,
    previewPost,
    imagePreviewUrl,
    uploadImageMutation,
    imageUploadErrorMessage,
    lifePostMutationErrorMessage,
    showToast,
    lifePostAiInput,
    notificationAiInput,
    lifePostAiResource,
    publishReadinessChecks,
    isPublishReady,
    isScheduleValid,
    isCtaUrlValid,
    openPost,
    newPost,
    saveLifePost,
    submitCurrentLifePostReview,
    returnLifePostToDraft,
    publishCurrentLifePost,
    unpublishCurrentLifePost,
    archiveCurrentLifePost,
    deleteCurrentLifePost,
    openRegistrationEditor,
    openRegistrationCreator,
    applyRegistrationFilters,
    setRegistrationPage,
    closeCheckInCodeDialog,
    statusColor,
    visibilityColor,
    iconLabel,
    formatSchedule,
    formatDateTime,
    uploadSelectedImage,
    clearImage,
    applyLifePostAiDraft,
    applyNotificationAiDraft,
    requestArchive,
    requestDelete,
    confirmPendingAction
  };
}
