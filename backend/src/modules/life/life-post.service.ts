import type {
  EventCheckInCodeCreateRequest,
  EventRegistrationAdminCreateRequest,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  EventRegistrationRequest,
  EventRegistrationStatus,
  EventRegistrationUpdateRequest,
  LifePost,
  LifePostListQuery,
  LifePostPublishRequest,
  LifePostUpdateRequest,
  LifePostUpsertRequest,
  PublicLifePost
} from "@mbc/api-contracts";

import {
  dedupeAndSortLifePosts,
  eventRegistrationSummary
} from "./event_registration_summary.js";
import { LifeEventAttendanceService } from "./life_event_attendance.service.js";
import { LifeEventRegistrationService } from "./life_event_registration.service.js";
import type { LifePostMutationContext } from "./life_post_mutation_policy.js";
import {
  toPublicLifePost,
  withLifePostReadState,
  withLifePostReadStates
} from "./life_post_read_projection.js";
import { LifePostWriteService } from "./life_post_write.service.js";
import type { LifePostRepository } from "./life-post.repository.js";

export class LifePostService {
  private readonly eventAttendanceService: LifeEventAttendanceService;
  private readonly eventRegistrationService: LifeEventRegistrationService;
  private readonly writeService: LifePostWriteService;

  constructor(private readonly repository: LifePostRepository) {
    this.writeService = new LifePostWriteService(repository);
    this.eventRegistrationService = new LifeEventRegistrationService(
      repository
    );
    this.eventAttendanceService = new LifeEventAttendanceService(
      repository,
      (id, userId) => this.getByIdForMemberWithRegistration(id, userId)
    );
  }

  list(query: LifePostListQuery) {
    return this.withRegistrationSummaries(this.repository.list(query));
  }

  async listPublic(query: LifePostListQuery) {
    const posts = await this.withRegistrationSummaries(
      this.repository.list(query)
    );
    return posts.map(toPublicLifePost);
  }

  countPosts() {
    return this.repository.countPosts();
  }

  summarizeEventParticipation() {
    return this.repository.summarizeEventParticipation();
  }

  async listForMember(query: LifePostListQuery, userId?: string) {
    const [publicPosts, memberPosts] = await Promise.all([
      this.repository.list({
        ...query,
        visibility: "public",
        status: "published"
      }),
      this.repository.list({
        ...query,
        visibility: "members",
        status: "published"
      })
    ]);
    const posts = await this.withRegistrationSummaries(
      Promise.resolve(
        dedupeAndSortLifePosts([...publicPosts, ...memberPosts]).slice(
          0,
          query.limit
        )
      ),
      userId
    );
    return withLifePostReadStates(
      this.repository,
      posts.map(toPublicLifePost),
      userId
    );
  }

  async getById(id: string) {
    const post = await this.repository.getById(id);
    return post ? this.withRegistrationSummary(post) : null;
  }

  async getByIdForMember(id: string) {
    const post = await this.repository.getById(id);
    if (
      !post ||
      post.status !== "published" ||
      !["public", "members"].includes(post.visibility)
    ) {
      return null;
    }
    return toPublicLifePost(await this.withRegistrationSummary(post));
  }

  async getByIdForMemberWithRegistration(id: string, userId: string) {
    const post = await this.repository.getById(id);
    if (
      !post ||
      post.status !== "published" ||
      !["public", "members"].includes(post.visibility)
    ) {
      return null;
    }
    return withLifePostReadState(
      this.repository,
      toPublicLifePost(await this.withRegistrationSummary(post, userId)),
      userId
    );
  }

  create(input: LifePostUpsertRequest) {
    return this.writeService.create(input);
  }

  async update(
    id: string,
    input: LifePostUpdateRequest,
    context: LifePostMutationContext
  ) {
    return this.writeService.update(id, input, context);
  }

  publish(
    id: string,
    input: LifePostPublishRequest,
    context: LifePostMutationContext
  ) {
    return this.writeService.publish(id, input, context);
  }

  unpublish(id: string, context: LifePostMutationContext) {
    return this.writeService.unpublish(id, context);
  }

  submitReview(id: string, context: LifePostMutationContext) {
    return this.writeService.submitReview(id, context);
  }

  returnDraft(id: string, context: LifePostMutationContext) {
    return this.writeService.returnDraft(id, context);
  }

  archive(id: string, context: LifePostMutationContext) {
    return this.writeService.archive(id, context);
  }

  async markReadForMember(id: string, userId: string) {
    const post = await this.repository.getById(id);
    if (
      !post ||
      post.status !== "published" ||
      !["public", "members"].includes(post.visibility)
    ) {
      return null;
    }
    await this.repository.markRead(id, userId);
    return this.getByIdForMemberWithRegistration(id, userId);
  }

  delete(id: string, context: LifePostMutationContext) {
    return this.writeService.delete(id, context);
  }

  listRegistrations(lifePostId: string, query: EventRegistrationListQuery) {
    return this.eventRegistrationService.listRegistrations(lifePostId, query);
  }

  registerForEvent(
    lifePostId: string,
    user: {
      id: string;
      displayName: string;
      email: string;
    },
    input: EventRegistrationRequest
  ) {
    return this.eventRegistrationService.registerForEvent(
      lifePostId,
      user,
      input
    );
  }

  createRegistrationForAdmin(
    lifePostId: string,
    input: EventRegistrationAdminCreateRequest
  ) {
    return this.eventRegistrationService.createRegistrationForAdmin(
      lifePostId,
      input
    );
  }

  cancelEventRegistration(lifePostId: string, userId: string) {
    return this.eventRegistrationService.cancelEventRegistration(
      lifePostId,
      userId
    );
  }

  updateEventRegistrationForMember(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ) {
    return this.eventRegistrationService.updateEventRegistrationForMember(
      lifePostId,
      userId,
      input
    );
  }

  checkInEventRegistrationForMember(lifePostId: string, userId: string) {
    return this.eventAttendanceService.checkInForMember(lifePostId, userId);
  }

  createOrRotateEventCheckInCode(
    lifePostId: string,
    input: EventCheckInCodeCreateRequest,
    actorAdminUserId?: string | null
  ) {
    return this.eventAttendanceService.createOrRotateCheckInCode(
      lifePostId,
      input,
      actorAdminUserId
    );
  }

  checkInEventRegistrationWithCode(rawCode: string, userId: string) {
    return this.eventAttendanceService.checkInWithCode(rawCode, userId);
  }

  updateRegistrationStatus(
    lifePostId: string,
    registrationId: string,
    status: EventRegistrationStatus
  ) {
    return this.eventRegistrationService.updateRegistrationStatus(
      lifePostId,
      registrationId,
      status
    );
  }

  updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationUpdateRequest,
    actorAdminUserId?: string | null
  ) {
    return this.eventRegistrationService.updateRegistration(
      lifePostId,
      registrationId,
      input,
      actorAdminUserId
    );
  }

  exportRegistrationsCsv(lifePostId: string) {
    return this.eventRegistrationService.exportRegistrationsCsv(lifePostId);
  }

  private async withRegistrationSummaries<T extends LifePost>(
    postsPromise: Promise<T[]>,
    userId?: string
  ): Promise<T[]> {
    const posts = await postsPromise;
    return Promise.all(
      posts.map((post) => this.withRegistrationSummary(post, userId))
    );
  }

  private async withRegistrationSummary<T extends LifePost>(
    post: T,
    userId?: string
  ): Promise<T> {
    const registeredCount = post.registrationEnabled
      ? await this.repository.countActiveRegistrationPartySize(post.id)
      : 0;
    const myRegistration = userId
      ? await this.repository.getActiveRegistrationForUser(post.id, userId)
      : null;
    return {
      ...post,
      registrationSummary: eventRegistrationSummary(
        post,
        registeredCount,
        myRegistration
      )
    };
  }
}
