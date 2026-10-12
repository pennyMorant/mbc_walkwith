import type {
  LifePost,
  LifePostPublishRequest,
  LifePostUpdateRequest,
  LifePostUpsertRequest
} from "@mbc/api-contracts";

import {
  lifePostScheduleInvalid,
  lifePostStateChanged
} from "./life-post-errors.js";
import type { LifePostRepository } from "./life-post.repository.js";
import {
  type LifePostMutationContext,
  validateLifePostMutation
} from "./life_post_mutation_policy.js";

export class LifePostWriteService {
  constructor(private readonly repository: LifePostRepository) {}

  create(input: LifePostUpsertRequest) {
    validateLifePostSchedule(input.startsAt ?? null, input.endsAt ?? null);
    return this.repository.create(input);
  }

  async update(
    id: string,
    input: LifePostUpdateRequest,
    context: LifePostMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return null;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    validateLifePostSchedule(
      input.startsAt === undefined ? existing.startsAt : input.startsAt,
      input.endsAt === undefined ? existing.endsAt : input.endsAt
    );
    validateLifePostMutation(existing, input, context);
    const updated = await this.repository.update(id, input, {
      expectedRevision: context.expectedRevision
    });
    if (updated) {
      return updated;
    }
    const current = await this.repository.getById(id);
    if (!current) {
      return null;
    }
    validateLifePostMutation(current, input, context);
    throw lifePostStateChanged(id);
  }

  publish(
    id: string,
    input: LifePostPublishRequest,
    context: LifePostMutationContext
  ) {
    return this.update(
      id,
      {
        ...input.content,
        visibility: input.visibility,
        status: "published"
      },
      context
    );
  }

  unpublish(id: string, context: LifePostMutationContext) {
    return this.update(
      id,
      { visibility: "private", status: "draft" },
      context
    );
  }

  submitReview(id: string, context: LifePostMutationContext) {
    return this.update(id, { status: "needs_review" }, context);
  }

  returnDraft(id: string, context: LifePostMutationContext) {
    return this.update(id, { status: "draft" }, context);
  }

  archive(id: string, context: LifePostMutationContext) {
    return this.update(
      id,
      { status: "archived", visibility: "private" },
      context
    );
  }

  async delete(id: string, context: LifePostMutationContext) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return false;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    validateLifePostMutation(existing, {}, context);
    const deleted = await this.repository.delete(id, {
      expectedRevision: context.expectedRevision
    });
    if (deleted) {
      return true;
    }
    const current = await this.repository.getById(id);
    if (!current) {
      return false;
    }
    validateLifePostMutation(current, {}, context);
    throw lifePostStateChanged(id);
  }
}

function assertExpectedRevision(post: LifePost, expectedRevision: number) {
  if (post.revision !== expectedRevision) {
    throw lifePostStateChanged(post.id);
  }
}

function validateLifePostSchedule(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined
) {
  if (!startsAt || !endsAt) {
    return;
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw lifePostScheduleInvalid({ startsAt, endsAt });
  }
}
