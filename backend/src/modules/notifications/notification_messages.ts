import type {
  LifePost,
  LifePostPublishNotification,
  NotificationAudience,
  PrayerRequest,
  Sermon
} from "@mbc/api-contracts";

import type { PushMessage } from "./push.provider.js";

export function sermonPublishedMessage(sermon: Sermon): PushMessage {
  const summary = sermon.summary?.trim();
  const title = sermon.primaryReference
    ? `New sermon: ${sermon.primaryReference}`
    : `New sermon: ${sermon.title}`;
  const body = summary?.length
    ? summary.slice(0, 140)
    : `${sermon.title} by ${sermon.speaker}`;

  return {
    type: "sermon_published",
    title,
    body,
    route: "/sermons",
    data: {
      sermonId: sermon.id
    }
  };
}

export function lifePostPublishedMessage(
  post: LifePost,
  notification: LifePostPublishNotification
): PushMessage {
  const title = notification.title?.trim() || `Church life: ${post.title}`;
  const body =
    notification.body?.trim() ||
    excerpt(post.body) ||
    post.meta.trim() ||
    "A new church life update is available.";

  return {
    type: "life_post_published",
    title,
    body,
    route: `/life/posts/${post.id}`,
    data: {
      lifePostId: post.id,
      targetType: "life_post",
      targetId: post.id
    }
  };
}

export function weeklyBulletinPublishedMessage(
  post: LifePost,
  notification: LifePostPublishNotification
): PushMessage {
  const title = notification.title?.trim() || `Weekly bulletin: ${post.title}`;
  const body =
    notification.body?.trim() ||
    excerpt(post.meta) ||
    excerpt(post.body) ||
    "This week's church bulletin is available.";

  return {
    type: "weekly_bulletin_published",
    title,
    body,
    route: `/life/posts/${post.id}`,
    data: {
      lifePostId: post.id,
      targetType: "life_post",
      targetId: post.id
    }
  };
}

export function prayerUpdatePublishedMessage(
  request: PrayerRequest
): PushMessage {
  return {
    type: "prayer_update_published",
    title: "Prayer update",
    body: "A new prayer update is available.",
    route: "/life",
    data: {
      prayerRequestId: request.id,
      targetType: "prayer_request",
      targetId: request.id
    }
  };
}

export function audienceForLifePost(post: LifePost): NotificationAudience {
  return post.visibility === "public" ? "public" : "members";
}

export function isWeeklyBulletinPost(post: LifePost) {
  return post.type === "weekly_bulletin" || post.type === "sunday";
}

function excerpt(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}
