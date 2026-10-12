import type {
  LifePost,
  LifePostUpdateRequest
} from "@mbc/api-contracts";

import {
  lifePostPublishNotReady,
  lifePostPublishPermissionDenied
} from "./life-post-errors.js";

export type LifePostMutationContext = {
  canPublish: boolean;
  expectedRevision: number;
};

export function validateLifePostMutation(
  post: LifePost,
  input: LifePostUpdateRequest,
  context: LifePostMutationContext
) {
  const candidate = buildLifePostCandidate(post, input);
  if (
    (post.status === "published" || candidate.status === "published") &&
    !context.canPublish
  ) {
    throw lifePostPublishPermissionDenied(post.id);
  }
  if (candidate.status === "published") {
    assertLifePostPublishReady(candidate);
  }
}

function buildLifePostCandidate(
  post: LifePost,
  input: LifePostUpdateRequest
): LifePost {
  return {
    ...post,
    type: input.type ?? post.type,
    title: input.title ?? post.title,
    body: input.body ?? post.body,
    meta: input.meta ?? post.meta,
    iconName: input.iconName ?? post.iconName,
    startsAt: input.startsAt === undefined ? post.startsAt : input.startsAt,
    endsAt: input.endsAt === undefined ? post.endsAt : input.endsAt,
    visibility: input.visibility ?? post.visibility,
    imageUrl: input.imageUrl === undefined ? post.imageUrl : input.imageUrl,
    displayWeight: input.displayWeight ?? post.displayWeight,
    ctaLabel: input.ctaLabel === undefined ? post.ctaLabel : input.ctaLabel,
    ctaUrl: input.ctaUrl === undefined ? post.ctaUrl : input.ctaUrl,
    registrationEnabled:
      input.registrationEnabled ?? post.registrationEnabled,
    registrationCapacity:
      input.registrationCapacity === undefined
        ? post.registrationCapacity
        : input.registrationCapacity,
    registrationDeadline:
      input.registrationDeadline === undefined
        ? post.registrationDeadline
        : input.registrationDeadline,
    registrationAllowCancellation:
      input.registrationAllowCancellation ??
      post.registrationAllowCancellation,
    registrationMaxPartySize:
      input.registrationMaxPartySize ?? post.registrationMaxPartySize,
    status: input.status ?? post.status
  };
}

function assertLifePostPublishReady(post: LifePost) {
  const missing: string[] = [];
  if (!post.title.trim()) {
    missing.push("title");
  }
  if (!post.body.trim()) {
    missing.push("body");
  }
  if (Boolean(post.ctaLabel?.trim()) !== Boolean(post.ctaUrl?.trim())) {
    missing.push("action");
  } else if (post.ctaUrl && !/^https?:\/\//i.test(post.ctaUrl)) {
    missing.push("action_url");
  }
  if (missing.length > 0) {
    throw lifePostPublishNotReady(post.id, missing);
  }
}
