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
import { randomUUID } from "node:crypto";

import {
  SermonDiscussionPublicGuideConflictError,
  type SermonDiscussionGuideRepository,
  type SermonDiscussionViewer
} from "./sermon-discussion-guide.repository.js";

export class InMemorySermonDiscussionGuideRepository
  implements SermonDiscussionGuideRepository
{
  private guides = new Map<string, SermonDiscussionGuide>();
  private responses = new Map<string, SermonDiscussionResponse>();

  async listGuides(
    query: SermonDiscussionGuideListQuery
  ): Promise<SermonDiscussionGuide[]> {
    const needle = query.query?.trim().toLowerCase();
    return [...this.guides.values()]
      .filter((guide) => {
        if (query.sermonId && guide.sermonId !== query.sermonId) {
          return false;
        }
        if (query.status && guide.status !== query.status) {
          return false;
        }
        if (query.audienceType && guide.audienceType !== query.audienceType) {
          return false;
        }
        return needle
          ? `${guide.title} ${guide.summary}`.toLowerCase().includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getGuideById(id: string): Promise<SermonDiscussionGuide | null> {
    return this.guides.get(id) ?? null;
  }

  async getPublishedGuideBySermonId(
    sermonId: string
  ): Promise<SermonDiscussionGuide | null> {
    return (
      [...this.guides.values()].find(
        (guide) =>
          guide.sermonId === sermonId &&
          guide.status === "published" &&
          guide.audienceType === "public"
      ) ?? null
    );
  }

  async createGuide(
    input: SermonDiscussionGuideCreateRequest
  ): Promise<SermonDiscussionGuide> {
    const now = new Date().toISOString();
    const guide: SermonDiscussionGuide = {
      id: randomUUID(),
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
      createdAt: now,
      updatedAt: now
    };
    this.guides.set(guide.id, guide);
    return guide;
  }

  async updateGuide(
    id: string,
    input: SermonDiscussionGuideUpdateRequest
  ): Promise<SermonDiscussionGuide | null> {
    const existing = this.guides.get(id);
    if (!existing || existing.revision !== input.expectedRevision) {
      return null;
    }
    const now = new Date().toISOString();
    const nextStatus = input.status ?? existing.status;
    const nextAudienceType = input.audienceType ?? existing.audienceType;
    if (
      nextStatus === "published" &&
      nextAudienceType === "public" &&
      [...this.guides.values()].some(
        (guide) =>
          guide.id !== id &&
          guide.sermonId === existing.sermonId &&
          guide.status === "published" &&
          guide.audienceType === "public"
      )
    ) {
      throw new SermonDiscussionPublicGuideConflictError(existing.sermonId);
    }
    const updated: SermonDiscussionGuide = {
      ...existing,
      revision: existing.revision + 1,
      sourceLocale: input.sourceLocale ?? existing.sourceLocale,
      title: input.title === undefined ? existing.title : input.title.trim(),
      summary:
        input.summary === undefined
          ? existing.summary
          : input.summary.trim(),
      status: nextStatus,
      audienceType: nextAudienceType,
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
        nextStatus === "published" ? (existing.publishedAt ?? now) : null,
      updatedAt: now
    };
    this.guides.set(id, updated);
    return updated;
  }

  async listResponses(
    query: SermonDiscussionResponseListQuery
  ): Promise<SermonDiscussionResponse[]> {
    return [...this.responses.values()]
      .filter((response) => {
        if (query.guideId && response.guideId !== query.guideId) {
          return false;
        }
        if (query.status && response.status !== query.status) {
          return false;
        }
        if (query.userType && response.userType !== query.userType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getResponseById(
    id: string
  ): Promise<SermonDiscussionResponse | null> {
    return this.responses.get(id) ?? null;
  }

  async createResponse(
    guideId: string,
    viewer: SermonDiscussionViewer,
    input: SermonDiscussionResponseCreateRequest
  ): Promise<SermonDiscussionResponse> {
    const now = new Date().toISOString();
    const response: SermonDiscussionResponse = {
      id: randomUUID(),
      guideId,
      questionId: input.questionId ?? null,
      userType: viewer.userType,
      userId: viewer.userId,
      status: input.status,
      content: input.content.trim(),
      createdAt: now,
      updatedAt: now
    };
    this.responses.set(response.id, response);
    return response;
  }

  async updateResponseStatus(
    id: string,
    status: SermonDiscussionResponseStatus
  ): Promise<SermonDiscussionResponse | null> {
    const existing = this.responses.get(id);
    if (!existing) {
      return null;
    }
    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };
    this.responses.set(id, updated);
    return updated;
  }
}
