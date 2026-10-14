import type {
  EventCheckInCode,
  EventRegistration,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  LifePost,
  LifePostListQuery,
  LifePostUpdateRequest,
  LifePostUpsertRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  EventCheckInCodeCreateInput,
  EventRegistrationAdminUpdateInput,
  EventRegistrationAttendanceInput,
  EventRegistrationCreateInput,
  EventRegistrationStore
} from "./event_registration.repository.js";
import { InMemoryEventRegistrationRepository } from "./in_memory_event_registration.repository.js";
import { seedLifePosts } from "./in_memory_life_post_seed.js";
import type { LifePostRepository } from "./life-post.repository.js";
import type {
  LifePostMutationOptions,
  LifePostReadState
} from "./life-post.repository.js";
import { lifePostRegistrationSummary } from "./life_post_registration_summary.js";

export class InMemoryLifePostRepository implements LifePostRepository {
  private posts = new Map<string, LifePost>(
    seedLifePosts.map((post) => [post.id, post])
  );
  private readStates = new Map<string, LifePostReadState>();
  private eventRegistrations = new InMemoryEventRegistrationRepository((id) =>
    this.getById(id)
  );

  async list(query: LifePostListQuery): Promise<LifePost[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.posts.values()]
      .filter((post) => {
        if (query.visibility && post.visibility !== query.visibility) {
          return false;
        }
        if (query.status && post.status !== query.status) {
          return false;
        }
        if (query.type && post.type !== query.type) {
          return false;
        }
        if (!postTouchesRange(post, query.from, query.to)) {
          return false;
        }
        if (normalizedQuery) {
          return [post.type, post.title, post.body, post.meta]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort(
        query.sort === "starts_at_asc"
          ? compareLifePostsByStartAsc
          : compareLifePosts
      )
      .slice(0, query.limit);
  }

  async countPosts(): Promise<number> {
    return this.posts.size;
  }

  async summarizeEventParticipation() {
    return this.eventRegistrations.summarizeParticipation();
  }

  async getById(id: string): Promise<LifePost | null> {
    return this.posts.get(id) ?? null;
  }

  async create(input: LifePostUpsertRequest): Promise<LifePost> {
    const now = new Date().toISOString();
    const post: LifePost = {
      id: randomUUID(),
      revision: 0,
      sourceLocale: input.sourceLocale,
      type: input.type,
      title: input.title,
      body: input.body,
      meta: input.meta,
      iconName: input.iconName,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      visibility: input.visibility,
      imageUrl: input.imageUrl ?? null,
      displayWeight: input.displayWeight,
      ctaLabel: cleanNullableString(input.ctaLabel),
      ctaUrl: cleanNullableString(input.ctaUrl),
      registrationEnabled: input.registrationEnabled,
      registrationCapacity: input.registrationCapacity ?? null,
      registrationDeadline: input.registrationDeadline ?? null,
      registrationAllowCancellation: input.registrationAllowCancellation,
      registrationMaxPartySize: input.registrationMaxPartySize,
      registrationSummary: lifePostRegistrationSummary(input),
      status: input.status,
      updatedAt: now
    };
    this.posts.set(post.id, post);
    return post;
  }

  async update(
    id: string,
    input: LifePostUpdateRequest,
    options: LifePostMutationOptions
  ): Promise<LifePost | null> {
    const existing = this.posts.get(id);
    if (!existing || existing.revision !== options.expectedRevision) {
      return null;
    }
    const updated: LifePost = {
      ...existing,
      revision: existing.revision + 1,
      sourceLocale: input.sourceLocale ?? existing.sourceLocale,
      type: input.type ?? existing.type,
      title: input.title ?? existing.title,
      body: input.body ?? existing.body,
      meta: input.meta ?? existing.meta,
      iconName: input.iconName ?? existing.iconName,
      startsAt:
        input.startsAt === undefined ? existing.startsAt : input.startsAt,
      endsAt: input.endsAt === undefined ? existing.endsAt : input.endsAt,
      visibility: input.visibility ?? existing.visibility,
      imageUrl:
        input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
      displayWeight: input.displayWeight ?? existing.displayWeight,
      ctaLabel:
        input.ctaLabel === undefined
          ? existing.ctaLabel
          : cleanNullableString(input.ctaLabel),
      ctaUrl:
        input.ctaUrl === undefined
          ? existing.ctaUrl
          : cleanNullableString(input.ctaUrl),
      registrationEnabled:
        input.registrationEnabled ?? existing.registrationEnabled,
      registrationCapacity:
        input.registrationCapacity === undefined
          ? existing.registrationCapacity
          : input.registrationCapacity,
      registrationDeadline:
        input.registrationDeadline === undefined
          ? existing.registrationDeadline
          : input.registrationDeadline,
      registrationAllowCancellation:
        input.registrationAllowCancellation ??
        existing.registrationAllowCancellation,
      registrationMaxPartySize:
        input.registrationMaxPartySize ?? existing.registrationMaxPartySize,
      registrationSummary: lifePostRegistrationSummary({
        registrationEnabled:
          input.registrationEnabled ?? existing.registrationEnabled,
        registrationCapacity:
          input.registrationCapacity === undefined
            ? existing.registrationCapacity
            : input.registrationCapacity,
        registrationDeadline:
          input.registrationDeadline === undefined
            ? existing.registrationDeadline
            : input.registrationDeadline,
        registrationAllowCancellation:
          input.registrationAllowCancellation ??
          existing.registrationAllowCancellation,
        registrationMaxPartySize:
          input.registrationMaxPartySize ?? existing.registrationMaxPartySize
      }),
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.posts.set(id, updated);
    return updated;
  }

  async delete(id: string, options: LifePostMutationOptions): Promise<boolean> {
    const existing = this.posts.get(id);
    if (!existing || existing.revision !== options.expectedRevision) {
      return false;
    }
    return this.posts.delete(id);
  }

  async listRegistrations(
    lifePostId: string,
    query: EventRegistrationListQuery
  ) {
    return this.eventRegistrations.listRegistrations(lifePostId, query);
  }

  async listAllRegistrations(lifePostId: string): Promise<EventRegistration[]> {
    return this.eventRegistrations.listAllRegistrations(lifePostId);
  }

  async getRegistrationById(
    lifePostId: string,
    registrationId: string
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.getRegistrationById(
      lifePostId,
      registrationId
    );
  }

  async getActiveRegistrationForUser(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
  }

  async withEventRegistrationLock<T>(
    lifePostId: string,
    operation: (store: EventRegistrationStore) => Promise<T>
  ): Promise<T> {
    return this.eventRegistrations.withEventRegistrationLock(
      lifePostId,
      operation
    );
  }

  async countActiveRegistrationPartySize(lifePostId: string): Promise<number> {
    return this.eventRegistrations.countActiveRegistrationPartySize(lifePostId);
  }

  async createRegistration(
    input: EventRegistrationCreateInput
  ): Promise<EventRegistration> {
    return this.eventRegistrations.createRegistration(input);
  }

  async cancelRegistration(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.cancelRegistration(lifePostId, userId);
  }

  async updateRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.updateRegistrationForUser(
      lifePostId,
      userId,
      input
    );
  }

  async checkInRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationAttendanceInput
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.checkInRegistrationForUser(
      lifePostId,
      userId,
      input
    );
  }

  async getActiveCheckInCode(
    lifePostId: string
  ): Promise<EventCheckInCode | null> {
    return this.eventRegistrations.getActiveCheckInCode(lifePostId);
  }

  async createCheckInCode(
    input: EventCheckInCodeCreateInput
  ): Promise<EventCheckInCode> {
    return this.eventRegistrations.createCheckInCode(input);
  }

  async disableActiveCheckInCodes(lifePostId: string): Promise<void> {
    return this.eventRegistrations.disableActiveCheckInCodes(lifePostId);
  }

  async getCheckInCodeByValue(value: string): Promise<EventCheckInCode | null> {
    return this.eventRegistrations.getCheckInCodeByValue(value);
  }

  async updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationAdminUpdateInput
  ): Promise<EventRegistration | null> {
    return this.eventRegistrations.updateRegistration(
      lifePostId,
      registrationId,
      input
    );
  }

  async listReadStates(
    userId: string,
    lifePostIds: readonly string[]
  ): Promise<LifePostReadState[]> {
    const requestedIds = new Set(lifePostIds);
    return [...this.readStates.values()].filter(
      (state) => state.userId === userId && requestedIds.has(state.lifePostId)
    );
  }

  async markRead(
    lifePostId: string,
    userId: string
  ): Promise<LifePostReadState> {
    const state: LifePostReadState = {
      lifePostId,
      userId,
      readAt: new Date().toISOString()
    };
    this.readStates.set(readStateKey(lifePostId, userId), state);
    return state;
  }
}

function readStateKey(lifePostId: string, userId: string) {
  return `${userId}:${lifePostId}`;
}

function compareLifePosts(a: LifePost, b: LifePost) {
  if (a.displayWeight !== b.displayWeight) {
    return b.displayWeight - a.displayWeight;
  }
  const startComparison = compareNullableIsoDesc(a.startsAt, b.startsAt);
  if (startComparison !== 0) {
    return startComparison;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

function compareLifePostsByStartAsc(a: LifePost, b: LifePost) {
  const startComparison = compareNullableIsoAsc(a.startsAt, b.startsAt);
  if (startComparison !== 0) {
    return startComparison;
  }
  if (a.displayWeight !== b.displayWeight) {
    return b.displayWeight - a.displayWeight;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

function compareNullableIsoAsc(
  a: string | null | undefined,
  b: string | null | undefined
) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

function compareNullableIsoDesc(
  a: string | null | undefined,
  b: string | null | undefined
) {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return b.localeCompare(a);
}

function postTouchesRange(
  post: LifePost,
  from: string | undefined,
  to: string | undefined
) {
  if (!from && !to) {
    return true;
  }
  const postStart = dateValue(post.startsAt ?? post.updatedAt);
  if (!postStart) {
    return false;
  }
  const postEnd = dateValue(post.endsAt) ?? postStart;
  if (from && postEnd <= new Date(from)) {
    return false;
  }
  if (to && postStart >= new Date(to)) {
    return false;
  }
  return true;
}

function dateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function cleanNullableString(value: string | null | undefined): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}
