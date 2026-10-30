import type {
  ReadingPlan,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentStatus,
  ReadingPlanCreateRequest,
  ReadingPlanStatus,
  ReadingPlanVisibility
} from "@mbc/api-contracts";

export type ReadingPlanFilterForm = {
  query: string;
  status: ReadingPlanStatus | "";
  visibility: ReadingPlanVisibility | "";
  locale: string;
};

export type ReadingPlanAssignmentFilterForm = {
  status: ReadingPlanAssignmentStatus | "";
  userType: "member" | "external" | "";
  userId: string;
};

export function createReadingPlanFilterForm(): ReadingPlanFilterForm {
  return { query: "", status: "", visibility: "", locale: "" };
}

export function readingPlanFilterSnapshot(
  filters: ReadingPlanFilterForm
): ReadingPlanFilterForm {
  return {
    query: filters.query.trim(),
    status: filters.status,
    visibility: filters.visibility,
    locale: filters.locale.trim()
  };
}

export function sameReadingPlanFilters(
  current: ReadingPlanFilterForm,
  next: ReadingPlanFilterForm
) {
  return (
    current.query === next.query &&
    current.status === next.status &&
    current.visibility === next.visibility &&
    current.locale === next.locale
  );
}

export function createReadingPlanAssignmentFilterForm(): ReadingPlanAssignmentFilterForm {
  return { status: "", userType: "", userId: "" };
}

export function readingPlanAssignmentFilterSnapshot(
  filters: ReadingPlanAssignmentFilterForm
): ReadingPlanAssignmentFilterForm {
  return {
    status: filters.status,
    userType: filters.userType,
    userId: filters.userId.trim()
  };
}

export function sameReadingPlanAssignmentFilters(
  current: ReadingPlanAssignmentFilterForm,
  next: ReadingPlanAssignmentFilterForm
) {
  return (
    current.status === next.status &&
    current.userType === next.userType &&
    current.userId === next.userId
  );
}

export function createReadingPlanForm(): ReadingPlanCreateRequest {
  return {
    title: "",
    description: "",
    status: "draft",
    visibility: "public",
    locale: "zh-Hans",
    durationDays: 7
  };
}

export function fillReadingPlanForm(
  form: ReadingPlanCreateRequest,
  plan: ReadingPlan
) {
  form.title = plan.title;
  form.description = plan.description;
  form.status = plan.status;
  form.visibility = plan.visibility;
  form.locale = plan.locale;
  form.durationDays = plan.durationDays;
}

export function resetReadingPlanForm(form: ReadingPlanCreateRequest) {
  Object.assign(form, createReadingPlanForm());
}

export function createReadingPlanAssignmentForm(): ReadingPlanAssignmentCreateRequest {
  return {
    planId: "",
    userType: "member",
    userId: "",
    sourceType: "admin",
    sourceId: null
  };
}

export function resetReadingPlanAssignmentTarget(
  form: ReadingPlanAssignmentCreateRequest,
  planId: string
) {
  form.planId = planId;
  form.userId = "";
  form.sourceId = null;
}

export function readingPlanCommandTargetsSelection(
  selectedPlanId: string | null,
  commandPlanId: string | null
) {
  return selectedPlanId === commandPlanId;
}
