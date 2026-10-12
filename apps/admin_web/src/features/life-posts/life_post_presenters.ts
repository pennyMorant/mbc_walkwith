import type {
  LifePost,
  LifePostStatus,
  LifePostVisibility
} from "@mbc/api-contracts";

type Translate = (key: string) => string;

export function lifePostStatusColor(status: LifePostStatus) {
  const colors: Record<LifePostStatus, string> = {
    draft: "secondary",
    needs_review: "warning",
    published: "success",
    archived: "grey"
  };
  return colors[status];
}

export function lifePostVisibilityColor(visibility: LifePostVisibility) {
  const colors: Record<LifePostVisibility, string> = {
    public: "success",
    members: "info",
    group: "warning",
    private: "secondary"
  };
  return colors[visibility];
}

export function lifePostIconLabel(iconName: string, t: Translate) {
  const label =
    {
      church: "Church",
      groups: "Groups",
      prayer: "Prayer",
      giving: "Giving",
      meal: "Meal",
      event: "Event"
    }[iconName] ?? iconName;
  return t(label);
}

export function formatLifePostSchedule(post: LifePost, t: Translate) {
  if (!post.startsAt) {
    return t("Not scheduled");
  }
  if (!post.endsAt) {
    return formatDateTime(post.startsAt);
  }
  return `${formatDateTime(post.startsAt)} - ${formatDateTime(post.endsAt)}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function isoFromDatetimeLocal(value: string) {
  const clean = value.trim();
  return clean ? new Date(clean).toISOString() : null;
}

export function datetimeLocalFromIso(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function nullableTrimmed(value: string) {
  const clean = value.trim();
  return clean || null;
}
