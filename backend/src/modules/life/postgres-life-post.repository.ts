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
import { and, desc, eq, gt, ilike, inArray, lt, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  eventRegistrations,
  lifePostReads,
  publicPosts
} from "../../shared/db/schema.js";
import type {
  EventCheckInCodeCreateInput,
  EventRegistrationAdminUpdateInput,
  EventRegistrationAttendanceInput,
  EventRegistrationCreateInput,
  EventRegistrationStore
} from "./event_registration.repository.js";
import type { LifePostRepository } from "./life-post.repository.js";
import type {
  LifePostMutationOptions,
  LifePostReadState
} from "./life-post.repository.js";
import { PostgresEventRegistrationRepository } from "./postgres_event_registration.repository.js";
import {
  cleanNullableString,
  dateFromIso,
  postFromRow,
  readStateFromRow
} from "./postgres_life_post_mappers.js";

export class PostgresLifePostRepository implements LifePostRepository {
  private readonly eventRegistrations: PostgresEventRegistrationRepository;

  constructor(private readonly db: AppDb) {
    this.eventRegistrations = new PostgresEventRegistrationRepository(db);
  }

  async list(query: LifePostListQuery): Promise<LifePost[]> {
    const filters = [
      query.visibility
        ? eq(publicPosts.visibility, query.visibility)
        : undefined,
      query.status ? eq(publicPosts.status, query.status) : undefined,
      query.type ? eq(publicPosts.type, query.type) : undefined,
      query.from
        ? gt(
            sql`coalesce(${publicPosts.endsAt}, ${publicPosts.startsAt}, ${publicPosts.updatedAt})`,
            new Date(query.from)
          )
        : undefined,
      query.to
        ? lt(
            sql`coalesce(${publicPosts.startsAt}, ${publicPosts.updatedAt})`,
            new Date(query.to)
          )
        : undefined,
      query.query
        ? or(
            ilike(publicPosts.type, `%${query.query}%`),
            ilike(publicPosts.title, `%${query.query}%`),
            ilike(publicPosts.body, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const ordering =
      query.sort === "starts_at_asc"
        ? [
            sql`${publicPosts.startsAt} asc nulls last`,
            desc(publicPosts.displayWeight),
            desc(publicPosts.updatedAt)
          ]
        : [
            desc(publicPosts.displayWeight),
            sql`${publicPosts.startsAt} desc nulls last`,
            desc(publicPosts.updatedAt)
          ];
    const rows = await this.db
      .select()
      .from(publicPosts)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(...ordering)
      .limit(query.limit);
    return rows.map(postFromRow);
  }

  async countPosts(): Promise<number> {
    const [row] = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(publicPosts);
    return Number(row?.value ?? 0);
  }

  async summarizeEventParticipation() {
    const [row] = await this.db
      .select({
        registrationCount: sql<number>`count(*) filter (where ${eventRegistrations.status} in ('confirmed', 'checked_in'))`,
        attendeeCount: sql<number>`coalesce(sum(case when ${eventRegistrations.status} in ('confirmed', 'checked_in') then ${eventRegistrations.partySize} else 0 end), 0)`,
        checkedInCount: sql<number>`coalesce(sum(case when ${eventRegistrations.status} = 'checked_in' then ${eventRegistrations.partySize} else 0 end), 0)`
      })
      .from(eventRegistrations);
    return {
      registrationCount: Number(row?.registrationCount ?? 0),
      attendeeCount: Number(row?.attendeeCount ?? 0),
      checkedInCount: Number(row?.checkedInCount ?? 0)
    };
  }

  async getById(id: string): Promise<LifePost | null> {
    const [row] = await this.db
      .select()
      .from(publicPosts)
      .where(eq(publicPosts.id, id))
      .limit(1);
    return row ? postFromRow(row) : null;
  }

  async create(input: LifePostUpsertRequest): Promise<LifePost> {
    const [row] = await this.db
      .insert(publicPosts)
      .values({
        sourceLocale: input.sourceLocale,
        type: input.type,
        title: input.title,
        body: input.body,
        meta: input.meta,
        iconName: input.iconName,
        startsAt: dateFromIso(input.startsAt),
        endsAt: dateFromIso(input.endsAt),
        visibility: input.visibility,
        imageUrl: cleanNullableString(input.imageUrl),
        displayWeight: input.displayWeight,
        ctaLabel: cleanNullableString(input.ctaLabel),
        ctaUrl: cleanNullableString(input.ctaUrl),
        registrationEnabled: input.registrationEnabled,
        registrationCapacity: input.registrationCapacity ?? null,
        registrationDeadline: dateFromIso(input.registrationDeadline),
        registrationAllowCancellation: input.registrationAllowCancellation,
        registrationMaxPartySize: input.registrationMaxPartySize,
        status: input.status,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create life post.");
    }
    return postFromRow(row);
  }

  async update(
    id: string,
    input: LifePostUpdateRequest,
    options: LifePostMutationOptions
  ): Promise<LifePost | null> {
    return this.withLockedPost(
      id,
      options,
      async (transaction, existingRow) => {
        const existing = postFromRow(existingRow);
        const [row] = await transaction
          .update(publicPosts)
          .set({
            revision: sql`${publicPosts.revision} + 1`,
            sourceLocale: input.sourceLocale ?? existing.sourceLocale,
            type: input.type ?? existing.type,
            title: input.title ?? existing.title,
            body: input.body ?? existing.body,
            meta: input.meta ?? existing.meta,
            iconName: input.iconName ?? existing.iconName,
            startsAt:
              input.startsAt === undefined
                ? dateFromIso(existing.startsAt)
                : dateFromIso(input.startsAt),
            endsAt:
              input.endsAt === undefined
                ? dateFromIso(existing.endsAt)
                : dateFromIso(input.endsAt),
            visibility: input.visibility ?? existing.visibility,
            imageUrl:
              input.imageUrl === undefined
                ? existing.imageUrl
                : cleanNullableString(input.imageUrl),
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
                ? dateFromIso(existing.registrationDeadline)
                : dateFromIso(input.registrationDeadline),
            registrationAllowCancellation:
              input.registrationAllowCancellation ??
              existing.registrationAllowCancellation,
            registrationMaxPartySize:
              input.registrationMaxPartySize ??
              existing.registrationMaxPartySize,
            status: input.status ?? existing.status,
            updatedAt: new Date()
          })
          .where(eq(publicPosts.id, id))
          .returning();
        return row ? postFromRow(row) : null;
      }
    );
  }

  async delete(id: string, options: LifePostMutationOptions): Promise<boolean> {
    const deleted = await this.withLockedPost(
      id,
      options,
      async (transaction) => {
        const rows = await transaction
          .delete(publicPosts)
          .where(eq(publicPosts.id, id))
          .returning({ id: publicPosts.id });
        return rows.length > 0;
      }
    );
    return deleted ?? false;
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
    if (lifePostIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(lifePostReads)
      .where(
        and(
          eq(lifePostReads.userId, userId),
          inArray(lifePostReads.lifePostId, [...lifePostIds])
        )
      );
    return rows.map(readStateFromRow);
  }

  async markRead(
    lifePostId: string,
    userId: string
  ): Promise<LifePostReadState> {
    const now = new Date();
    const [row] = await this.db
      .insert(lifePostReads)
      .values({ lifePostId, userId, readAt: now })
      .onConflictDoUpdate({
        target: [lifePostReads.lifePostId, lifePostReads.userId],
        set: { readAt: now }
      })
      .returning();
    if (!row) {
      throw new Error("Failed to mark life post as read.");
    }
    return readStateFromRow(row);
  }

  private async withLockedPost<T>(
    id: string,
    options: LifePostMutationOptions,
    action: (
      transaction: AppTransaction,
      existing: typeof publicPosts.$inferSelect
    ) => Promise<T>
  ): Promise<T | null> {
    return this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(publicPosts)
        .where(eq(publicPosts.id, id))
        .for("update");
      if (!existing) {
        return null;
      }
      if (existing.revision !== options.expectedRevision) {
        return null;
      }
      return action(transaction, existing);
    });
  }
}

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
