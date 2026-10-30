import type {
  SermonDiscussionAudienceType,
  SermonDiscussionGuide,
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionGuideStatus
} from "@mbc/api-contracts";

export type SermonDiscussionGuideFilterForm = {
  query: string;
  sermonId: string;
  status: SermonDiscussionGuideStatus | "";
  audienceType: SermonDiscussionAudienceType | "";
};

export type SermonDiscussionResponseFilterForm = {
  userType: "member" | "external" | "";
};

export function createSermonDiscussionLocalIdFactory(
  now: () => number = Date.now
) {
  let sequence = 0;

  return (prefix: "question" | "action") => {
    sequence += 1;
    return `${prefix}_${now()}_${sequence}`;
  };
}

export function createSermonDiscussionGuideFilterForm(): SermonDiscussionGuideFilterForm {
  return { query: "", sermonId: "", status: "", audienceType: "" };
}

export function sermonDiscussionGuideFilterSnapshot(
  filters: SermonDiscussionGuideFilterForm
): SermonDiscussionGuideFilterForm {
  return {
    query: filters.query.trim(),
    sermonId: filters.sermonId.trim(),
    status: filters.status,
    audienceType: filters.audienceType
  };
}

export function sameSermonDiscussionGuideFilters(
  current: SermonDiscussionGuideFilterForm,
  next: SermonDiscussionGuideFilterForm
) {
  return (
    current.query === next.query &&
    current.sermonId === next.sermonId &&
    current.status === next.status &&
    current.audienceType === next.audienceType
  );
}

export function createSermonDiscussionResponseFilterForm(): SermonDiscussionResponseFilterForm {
  return { userType: "" };
}

export function createSermonDiscussionGuideForm(): SermonDiscussionGuideCreateRequest {
  return {
    sermonId: "",
    sourceLocale: "zh-Hans",
    title: "",
    summary: "",
    status: "draft",
    audienceType: "public",
    audienceId: null,
    questions: [],
    actionSteps: [],
    prayerPrompts: [],
    generatedMetadata: {}
  };
}

export function fillSermonDiscussionGuideForm(
  form: SermonDiscussionGuideCreateRequest,
  guide: SermonDiscussionGuide
) {
  form.sermonId = guide.sermonId;
  form.sourceLocale = guide.sourceLocale;
  form.title = guide.title;
  form.summary = guide.summary;
  form.status = guide.status;
  form.audienceType = guide.audienceType;
  form.audienceId = guide.audienceId;
  form.questions = guide.questions.map((question, index) => ({
    ...question,
    sort: question.sort ?? index
  }));
  form.actionSteps = guide.actionSteps.map((action, index) => ({
    ...action,
    sort: action.sort ?? index
  }));
  form.prayerPrompts = [...guide.prayerPrompts];
  form.generatedMetadata = { ...guide.generatedMetadata };
}

export function resetSermonDiscussionGuideForm(
  form: SermonDiscussionGuideCreateRequest
) {
  Object.assign(form, createSermonDiscussionGuideForm());
}

export function sermonDiscussionGuidePayload(
  form: SermonDiscussionGuideCreateRequest,
  nextLocalId: (prefix: "question" | "action") => string
): SermonDiscussionGuideCreateRequest {
  return {
    sermonId: form.sermonId.trim(),
    sourceLocale: form.sourceLocale,
    title: form.title.trim(),
    summary: form.summary.trim(),
    status: form.status,
    audienceType: form.audienceType,
    audienceId:
      form.audienceType === "public"
        ? null
        : form.audienceId?.trim() || null,
    questions: form.questions
      .map((question, index) => ({
        id: question.id.trim() || nextLocalId("question"),
        type: question.type,
        prompt: question.prompt.trim(),
        sort: index,
        startSeconds: question.startSeconds
      }))
      .filter((question) => question.prompt.length > 0),
    actionSteps: form.actionSteps
      .map((action, index) => ({
        id: action.id.trim() || nextLocalId("action"),
        title: action.title.trim(),
        description: action.description.trim(),
        sort: index
      }))
      .filter((action) => action.title.length > 0),
    prayerPrompts: form.prayerPrompts
      .map((prompt) => prompt.trim())
      .filter(Boolean),
    generatedMetadata: { ...form.generatedMetadata }
  };
}

export function sermonDiscussionGuideStatusOptions(
  guide: SermonDiscussionGuide | null
): SermonDiscussionGuideStatus[] {
  if (!guide) return ["draft", "review"];
  return {
    draft: ["draft", "review", "archived"],
    review: ["draft", "review", "published", "archived"],
    published: ["published", "review", "archived"],
    archived: ["archived", "draft"]
  }[guide.status] as SermonDiscussionGuideStatus[];
}

export function sermonDiscussionGuideContentLocked(
  guide: SermonDiscussionGuide | null,
  formStatus: SermonDiscussionGuideStatus
) {
  return (
    guide != null &&
    (guide.status === "published" || guide.status === "archived") &&
    formStatus === guide.status
  );
}

export function canSubmitSermonDiscussionGuide(
  canManage: boolean,
  form: SermonDiscussionGuideCreateRequest,
  selectedGuideId: string | null
) {
  return (
    canManage &&
    form.title.trim().length > 0 &&
    (selectedGuideId != null || form.sermonId.trim().length > 0) &&
    (form.audienceType === "public" || Boolean(form.audienceId?.trim()))
  );
}

export function sermonDiscussionCommandTargetsSelection(
  selectedGuideId: string | null,
  commandGuideId: string | null
) {
  return selectedGuideId === commandGuideId;
}

export function guideStatusColor(status: SermonDiscussionGuideStatus) {
  return {
    draft: "grey",
    review: "warning",
    published: "success",
    archived: "secondary"
  }[status];
}
