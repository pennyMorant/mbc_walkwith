import type {
  ContentLocale,
  LifePost,
  LifePostStatus,
  LifePostUpdateRequest,
  LifePostUpsertRequest,
  LifePostVisibility
} from "@mbc/api-contracts";

import {
  isoFromDatetimeLocal,
  nullableTrimmed
} from "./life_post_presenters";

type Translate = (key: string) => string;

export function createLifePostEditorForm() {
  return {
    sourceLocale: "zh-Hans" as ContentLocale,
    type: "sunday",
    title: "",
    body: "",
    meta: "",
    iconName: "church",
    startsAt: "",
    endsAt: "",
    visibility: "private" as LifePostVisibility,
    imageUrl: "",
    displayWeight: 0,
    ctaLabel: "",
    ctaUrl: "",
    registrationEnabled: false,
    registrationCapacity: null as number | null,
    registrationDeadline: "",
    registrationAllowCancellation: true,
    registrationMaxPartySize: 1,
    notifyAppOnPublish: false,
    notificationTitle: "",
    notificationBody: "",
    notificationTranslations: {
      en: { title: "", body: "" },
      es: { title: "", body: "" },
      "zh-Hans": { title: "", body: "" },
      "zh-Hant": { title: "", body: "" }
    } as Record<ContentLocale, { title: string; body: string }>,
    status: "draft" as LifePostStatus
  };
}

export type LifePostEditorForm = ReturnType<typeof createLifePostEditorForm>;

export function buildLifePostPreview(
  form: LifePostEditorForm,
  selectedPost: LifePost | null,
  t: Translate
): LifePost | null {
  if (!selectedPost && !form.title.trim()) {
    return null;
  }
  const registeredCount =
    selectedPost?.registrationSummary.registeredCount ?? 0;
  const registrationCapacity = form.registrationEnabled
    ? form.registrationCapacity
    : null;
  const registrationDeadline = form.registrationEnabled
    ? isoFromDatetimeLocal(form.registrationDeadline)
    : null;
  return {
    id: selectedPost?.id ?? "preview",
    revision: selectedPost?.revision ?? 0,
    sourceLocale: form.sourceLocale,
    type: form.type.trim() || "life",
    title: form.title.trim() || t("New life post"),
    body: form.body.trim(),
    meta: form.meta.trim(),
    iconName: form.iconName.trim() || "church",
    startsAt: isoFromDatetimeLocal(form.startsAt),
    endsAt: isoFromDatetimeLocal(form.endsAt),
    visibility: form.visibility,
    imageUrl: nullableTrimmed(form.imageUrl),
    displayWeight: form.displayWeight,
    ctaLabel: nullableTrimmed(form.ctaLabel),
    ctaUrl: nullableTrimmed(form.ctaUrl),
    registrationEnabled: form.registrationEnabled,
    registrationCapacity,
    registrationDeadline,
    registrationAllowCancellation: form.registrationAllowCancellation,
    registrationMaxPartySize: form.registrationMaxPartySize,
    registrationSummary: {
      enabled: form.registrationEnabled,
      capacity: registrationCapacity,
      registeredCount,
      remainingCount:
        registrationCapacity === null
          ? null
          : Math.max(registrationCapacity - registeredCount, 0),
      deadline: registrationDeadline,
      allowCancellation: form.registrationAllowCancellation,
      maxPartySize: form.registrationMaxPartySize,
      myRegistrationStatus: null,
      myPartySize: null,
      myNote: null,
      myCheckedInAt: null,
      myCheckInMethod: null
    },
    status: form.status,
    updatedAt: selectedPost?.updatedAt ?? new Date().toISOString()
  };
}

export function isLifePostScheduleValid(form: LifePostEditorForm) {
  if (!form.startsAt || !form.endsAt) {
    return true;
  }
  return new Date(form.endsAt).getTime() > new Date(form.startsAt).getTime();
}

export function isLifePostCtaUrlValid(form: LifePostEditorForm) {
  const label = nullableTrimmed(form.ctaLabel);
  const url = nullableTrimmed(form.ctaUrl);
  if (Boolean(label) !== Boolean(url)) {
    return false;
  }
  return !url || /^https?:\/\//i.test(url);
}

export function buildLifePostPayload(
  form: LifePostEditorForm,
  status: LifePostStatus | null
): LifePostUpdateRequest | LifePostUpsertRequest {
  return {
    sourceLocale: form.sourceLocale,
    type: form.type.trim(),
    title: form.title.trim(),
    body: form.body.trim(),
    meta: form.meta.trim(),
    iconName: form.iconName.trim() || "church",
    startsAt: isoFromDatetimeLocal(form.startsAt),
    endsAt: isoFromDatetimeLocal(form.endsAt),
    visibility: form.visibility,
    imageUrl: nullableTrimmed(form.imageUrl),
    displayWeight: form.displayWeight,
    ctaLabel: nullableTrimmed(form.ctaLabel),
    ctaUrl: nullableTrimmed(form.ctaUrl),
    registrationEnabled: form.registrationEnabled,
    registrationCapacity: form.registrationEnabled
      ? form.registrationCapacity
      : null,
    registrationDeadline: form.registrationEnabled
      ? isoFromDatetimeLocal(form.registrationDeadline)
      : null,
    registrationAllowCancellation: form.registrationAllowCancellation,
    registrationMaxPartySize: form.registrationMaxPartySize,
    ...(status ? { status } : {})
  };
}

export function buildLifePostPublishRequest(
  form: LifePostEditorForm,
  content?: LifePostUpdateRequest
) {
  const notificationTitle = nullableTrimmed(form.notificationTitle);
  const notificationBody = nullableTrimmed(form.notificationBody);
  const notificationTranslations: Partial<
    Record<ContentLocale, { title?: string; body?: string }>
  > = {};
  for (const locale of ["en", "es", "zh-Hans", "zh-Hant"] as const) {
    if (locale === form.sourceLocale) continue;
    const copy = form.notificationTranslations[locale];
    const title = nullableTrimmed(copy.title);
    const body = nullableTrimmed(copy.body);
    if (title || body) {
      notificationTranslations[locale] = {
        ...(title ? { title } : {}),
        ...(body ? { body } : {})
      };
    }
  }
  return {
    visibility: form.visibility === "members" ? "members" : "public",
    ...(content ? { content } : {}),
    notifyApp: form.notifyAppOnPublish,
    ...(form.notifyAppOnPublish &&
    (notificationTitle !== null ||
      notificationBody !== null ||
      Object.keys(notificationTranslations).length > 0)
      ? {
          notification: {
            sourceLocale: form.sourceLocale,
            ...(notificationTitle ? { title: notificationTitle } : {}),
            ...(notificationBody ? { body: notificationBody } : {}),
            ...(Object.keys(notificationTranslations).length > 0
              ? { translations: notificationTranslations }
              : {})
          }
        }
      : {})
  } as const;
}
