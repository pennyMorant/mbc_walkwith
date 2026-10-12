import { sermonDiscussionGuideSchema } from "@mbc/api-contracts";
import type {
  SermonDiscussionGuide,
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionGuideListQuery,
  SermonDiscussionGuideUpdateRequest,
  SermonDiscussionResponse,
  SermonDiscussionResponseCreateRequest,
  SermonDiscussionResponseListQuery,
  SermonDiscussionResponseStatus
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  sermonDiscussionGuides,
  sermonDiscussionResponses
} from "../../shared/db/schema.js";
import {
  SermonDiscussionPublicGuideConflictError,
  type SermonDiscussionGuideRepository,
  type SermonDiscussionViewer
} from "./sermon-discussion-guide.repository.js";

const publicPublishedConstraint =
  "uq_sermon_discussion_guides_public_published";

export class PostgresSermonDiscussionGuideRepository
  implements SermonDiscussionGuideRepository
{
  constructor(private readonly db: AppDb) {}

  async listGuides(
    query: SermonDiscussionGuideListQuery
  ): Promise<SermonDiscussionGuide[]> {
    const filters = [
      query.sermonId
        ? eq(sermonDiscussionGuides.sermonId, query.sermonId)
        : undefined,
      query.status
        ? eq(sermonDiscussionGuides.status, query.status)
        : undefined,
      query.audienceType
        ? eq(sermonDiscussionGuides.audienceType, query.audienceType)
        : undefined,
      query.query
        ? or(
            ilike(sermonDiscussionGuides.title, `%${query.query}%`),
            ilike(sermonDiscussionGuides.summary, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(sermonDiscussionGuides)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(sermonDiscussionGuides.updatedAt))
      .limit(query.limit);
    return rows.map(guideFromRow);
  }

  async getGuideById(id: string): Promise<SermonDiscussionGuide | null> {
    const [row] = await this.db
      .select()
      .from(sermonDiscussionGuides)
      .where(eq(sermonDiscussionGuides.id, id))
      .limit(1);
    return row ? guideFromRow(row) : null;
  }

  async getPublishedGuideBySermonId(
    sermonId: string
  ): Promise<SermonDiscussionGuide | null> {
    const [row] = await this.db
      .select()
      .from(sermonDiscussionGuides)
      .where(
        and(
          eq(sermonDiscussionGuides.sermonId, sermonId),
          eq(sermonDiscussionGuides.status, "published"),
          eq(sermonDiscussionGuides.audienceType, "public")
        )
      )
      .limit(1);
    return row ? guideFromRow(row) : null;
  }

  async createGuide(
    input: SermonDiscussionGuideCreateRequest
  ): Promise<SermonDiscussionGuide> {
    const now = new Date();
    const [row] = await this.db
      .insert(sermonDiscussionGuides)
      .values({
        sermonId: input.sermonId,
        revision: 0,
        sourceLocale: input.sourceLocale,
        title: input.title.trim(),
        summary: input.summary.trim(),
        status: input.status,
        audienceType: input.audienceType,
        audienceId: input.audienceId ?? null,
        questions: input.questions,
        actionSteps: input.actionSteps,
        prayerPrompts: input.prayerPrompts,
        generatedMetadata: input.generatedMetadata,
        publishedAt: input.status === "published" ? now : null,
        updatedAt: now
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create sermon discussion guide.");
    }
    return guideFromRow(row);
  }

  async updateGuide(
    id: string,
    input: SermonDiscussionGuideUpdateRequest
  ): Promise<SermonDiscussionGuide | null> {
    const existing = await this.getGuideById(id);
    if (!existing) {
      return null;
    }
    const nextStatus = input.status ?? existing.status;
    const now = new Date();
    try {
      const [row] = await this.db
        .update(sermonDiscussionGuides)
        .set({
          revision: sql`${sermonDiscussionGuides.revision} + 1`,
          sourceLocale: input.sourceLocale ?? existing.sourceLocale,
          title:
            input.title === undefined ? existing.title : input.title.trim(),
          summary:
            input.summary === undefined
              ? existing.summary
              : input.summary.trim(),
          status: nextStatus,
          audienceType: input.audienceType ?? existing.audienceType,
          audienceId:
            input.audienceId === undefined
              ? existing.audienceId
              : (input.audienceId ?? null),
          questions: input.questions ?? existing.questions,
          actionSteps: input.actionSteps ?? existing.actionSteps,
          prayerPrompts: input.prayerPrompts ?? existing.prayerPrompts,
          generatedMetadata:
            input.generatedMetadata ?? existing.generatedMetadata,
          publishedAt:
            nextStatus === "published"
              ? existing.publishedAt
                ? new Date(existing.publishedAt)
                : now
              : null,
          updatedAt: now
        })
        .where(
          and(
            eq(sermonDiscussionGuides.id, id),
            eq(sermonDiscussionGuides.revision, input.expectedRevision)
          )
        )
        .returning();
      return row ? guideFromRow(row) : null;
    } catch (error) {
      if (isPublicPublishedConstraintViolation(error)) {
        throw new SermonDiscussionPublicGuideConflictError(existing.sermonId);
      }
      throw error;
    }
  }

  async listResponses(
    query: SermonDiscussionResponseListQuery
  ): Promise<SermonDiscussionResponse[]> {
    const filters = [
      query.guideId
        ? eq(sermonDiscussionResponses.guideId, query.guideId)
        : undefined,
      query.status
        ? eq(sermonDiscussionResponses.status, query.status)
        : undefined,
      query.userType
        ? eq(sermonDiscussionResponses.userType, query.userType)
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(sermonDiscussionResponses)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(sermonDiscussionResponses.updatedAt))
      .limit(query.limit);
    return rows.map(responseFromRow);
  }

  async getResponseById(
    id: string
  ): Promise<SermonDiscussionResponse | null> {
    const [row] = await this.db
      .select()
      .from(sermonDiscussionResponses)
      .where(eq(sermonDiscussionResponses.id, id))
      .limit(1);
    return row ? responseFromRow(row) : null;
  }

  async createResponse(
    guideId: string,
    viewer: SermonDiscussionViewer,
    input: SermonDiscussionResponseCreateRequest
  ): Promise<SermonDiscussionResponse> {
    const [row] = await this.db
      .insert(sermonDiscussionResponses)
      .values({
        guideId,
        questionId: input.questionId ?? null,
        userType: viewer.userType,
        userId: viewer.userId,
        status: input.status,
        content: input.content.trim(),
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create sermon discussion response.");
    }
    return responseFromRow(row);
  }

  async updateResponseStatus(
    id: string,
    status: SermonDiscussionResponseStatus
  ): Promise<SermonDiscussionResponse | null> {
    const [row] = await this.db
      .update(sermonDiscussionResponses)
      .set({ status, updatedAt: new Date() })
      .where(eq(sermonDiscussionResponses.id, id))
      .returning();
    return row ? responseFromRow(row) : null;
  }
}

function guideFromRow(
  row: typeof sermonDiscussionGuides.$inferSelect
): SermonDiscussionGuide {
  return sermonDiscussionGuideSchema.parse({
    id: row.id,
    sermonId: row.sermonId,
    revision: row.revision,
    sourceLocale: row.sourceLocale as SermonDiscussionGuide["sourceLocale"],
    title: row.title,
    summary: row.summary,
    status: row.status,
    audienceType: row.audienceType,
    audienceId: row.audienceId,
    questions: row.questions,
    actionSteps: row.actionSteps,
    prayerPrompts: row.prayerPrompts,
    generatedMetadata: row.generatedMetadata,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function responseFromRow(
  row: typeof sermonDiscussionResponses.$inferSelect
): SermonDiscussionResponse {
  return {
    id: row.id,
    guideId: row.guideId,
    questionId: row.questionId,
    userType: row.userType,
    userId: row.userId,
    status: row.status,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function isPublicPublishedConstraintViolation(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") {
      return false;
    }
    const record = current as Record<string, unknown>;
    if (
      record.code === "23505" &&
      record.constraint === publicPublishedConstraint
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}
