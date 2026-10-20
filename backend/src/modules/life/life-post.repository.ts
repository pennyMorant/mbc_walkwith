import type {
  LifePost,
  LifePostListQuery,
  LifePostStatus,
  LifePostUpdateRequest,
  LifePostUpsertRequest
} from "@mbc/api-contracts";

import type { EventRegistrationRepository } from "./event_registration.repository.js";

export type LifePostSummary = Pick<
  LifePost,
  "id" | "title" | "type" | "status" | "sourceLocale" | "updatedAt"
>;

export interface LifePostRepository extends EventRegistrationRepository {
  list(query: LifePostListQuery): Promise<LifePost[]>;
  searchSummaries(query: string, limit: number): Promise<LifePostSummary[]>;
  listRecentlyUpdatedSummaries(limit: number): Promise<LifePostSummary[]>;
  countPosts(): Promise<number>;
  countByStatus(status: LifePostStatus): Promise<number>;
  summarizeEventParticipation(): Promise<EventParticipationSummary>;
  getById(id: string): Promise<LifePost | null>;
  listByImageMediaId(mediaId: string): Promise<LifePost[]>;
  create(input: LifePostUpsertRequest): Promise<LifePost>;
  update(
    id: string,
    input: LifePostUpdateRequest,
    options: LifePostMutationOptions
  ): Promise<LifePost | null>;
  delete(id: string, options: LifePostMutationOptions): Promise<boolean>;
  listReadStates(
    userId: string,
    lifePostIds: readonly string[]
  ): Promise<LifePostReadState[]>;
  markRead(lifePostId: string, userId: string): Promise<LifePostReadState>;
}

export type LifePostMutationOptions = {
  expectedRevision: number;
};

export type EventParticipationSummary = {
  registrationCount: number;
  attendeeCount: number;
  checkedInCount: number;
};

export type LifePostReadState = {
  lifePostId: string;
  userId: string;
  readAt: string;
};
