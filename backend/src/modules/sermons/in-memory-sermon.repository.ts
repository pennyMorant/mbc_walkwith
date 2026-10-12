import type {
  CreateLocalSermonDraftRequest,
  Sermon,
  SermonListQuery,
  SermonRecommendationQuery,
  UpdateSermonRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  SermonAudioInput,
  SermonAudioRecord,
  SermonListResult,
  SermonRepository,
  SermonUpdateOptions
} from "./sermon.repository.js";
import type { SermonAudioCleanupRepository } from "./sermon_audio_cleanup.repository.js";
import { recommendationScore } from "./sermon_recommendation_ranker.js";

export class InMemorySermonRepository implements SermonRepository {
  private sermons = new Map<string, Sermon>(
    seedSermons.map((sermon) => [sermon.id, sermon])
  );
  private audioRecords = new Map<string, SermonAudioRecord>();

  constructor(
    private readonly audioCleanupRepository?: SermonAudioCleanupRepository
  ) {}

  async list(query: SermonListQuery): Promise<SermonListResult> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    const filteredRows = [...this.sermons.values()]
      .filter((sermon) => {
        if (query.status && sermon.status !== query.status) {
          return false;
        }
        if (query.speaker && sermon.speaker !== query.speaker) {
          return false;
        }
        if (query.series && sermon.series !== query.series) {
          return false;
        }
        if (query.topic && !sermon.topics.includes(query.topic)) {
          return false;
        }
        if (!sermonInRange(sermon, query.from, query.to)) {
          return false;
        }
        if (
          query.bookId &&
          !sermon.references.some((reference) =>
            reference.verseId.startsWith(`${query.bookId}.`)
          )
        ) {
          return false;
        }
        if (normalizedQuery) {
          const haystack = [
            sermon.title,
            sermon.speaker,
            sermon.series,
            ...sermon.topics,
            sermon.primaryReference,
            sermon.summary,
            sermon.transcript?.text,
            ...sermon.references.flatMap((reference) => [
              reference.reference,
              reference.note
            ])
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.sermonDate.localeCompare(a.sermonDate));
    const cursorDate = query.cursor ? new Date(query.cursor) : null;
    const rows = cursorDate
      ? filteredRows.filter((sermon) => new Date(sermon.sermonDate) < cursorDate)
      : filteredRows;
    const pageRows = rows.slice(0, query.limit + 1);

    return {
      sermons: pageRows.slice(0, query.limit),
      nextCursor:
        pageRows.length > query.limit
          ? new Date(pageRows[query.limit]!.sermonDate).toISOString()
          : null
    };
  }

  async countByStatus(status: Sermon["status"]): Promise<number> {
    return [...this.sermons.values()].filter(
      (sermon) => sermon.status === status
    ).length;
  }

  async getById(id: string): Promise<Sermon | null> {
    return this.sermons.get(id) ?? null;
  }

  async createDraft(input: CreateLocalSermonDraftRequest): Promise<Sermon> {
    const now = new Date().toISOString();
    const id = `sermon_${randomUUID()}`;
    const sermon: Sermon = {
      id,
      revision: 0,
      sourceLocale: input.sourceLocale,
      title: input.title,
      speaker: input.speaker,
      sermonDate: input.sermonDate,
      series: input.series ?? null,
      topics: input.topics ?? [],
      primaryReference: input.primaryReference ?? null,
      summary: input.summary ?? null,
      durationSeconds: 0,
      thumbnailUrl: null,
      audio: emptyAudio(),
      status: "draft",
      publishedAt: null,
      outline: [],
      references: [],
      transcript: input.transcript
        ? { ...input.transcript, updatedAt: now }
        : null,
      reviewMarkdown: input.reviewMarkdown ?? null,
      processingMetadata: null,
      createdAt: now,
      updatedAt: now
    };
    this.sermons.set(id, sermon);
    return sermon;
  }

  async recommendations(query: SermonRecommendationQuery): Promise<Sermon[]> {
    return [...this.sermons.values()]
      .filter((sermon) => sermon.status === "published")
      .map((sermon) => ({
        sermon,
        score: recommendationScore(sermon, query)
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        const scoreCompare = b.score - a.score;
        if (scoreCompare !== 0) {
          return scoreCompare;
        }
        return b.sermon.sermonDate.localeCompare(a.sermon.sermonDate);
      })
      .slice(0, query.limit)
      .map((row) => row.sermon);
  }

  async discoveryFacets() {
    const published = [...this.sermons.values()].filter(
      (sermon) => sermon.status === "published"
    );
    return {
      speakers: sortedUnique(published.map((sermon) => sermon.speaker)),
      series: sortedUnique(
        published.flatMap((sermon) => (sermon.series ? [sermon.series] : []))
      ),
      topics: sortedUnique(published.flatMap((sermon) => sermon.topics))
    };
  }

  async update(
    id: string,
    input: UpdateSermonRequest,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    const existing = this.sermons.get(id);
    if (!existing) {
      return null;
    }
    if (
      options.expectedRevision !== undefined &&
      options.expectedRevision !== existing.revision
    ) {
      return null;
    }

    const nextStatus = input.status ?? existing.status;
    const updated: Sermon = {
      ...existing,
      revision: existing.revision + 1,
      sourceLocale: input.sourceLocale ?? existing.sourceLocale,
      title: input.title ?? existing.title,
      speaker: input.speaker ?? existing.speaker,
      sermonDate: input.sermonDate ?? existing.sermonDate,
      series: input.series === undefined ? existing.series : input.series,
      topics: input.topics ?? existing.topics,
      primaryReference:
        input.primaryReference === undefined
          ? existing.primaryReference
          : input.primaryReference,
      summary: input.summary === undefined ? existing.summary : input.summary,
      durationSeconds: input.durationSeconds ?? existing.durationSeconds,
      status: nextStatus,
      outline: input.outline ?? existing.outline,
      references: input.references ?? existing.references,
      transcript:
        input.transcript === undefined ? existing.transcript : input.transcript,
      reviewMarkdown:
        input.reviewMarkdown === undefined
          ? existing.reviewMarkdown
          : input.reviewMarkdown,
      processingMetadata:
        input.processingMetadata === undefined
          ? existing.processingMetadata
          : input.processingMetadata,
      publishedAt: nextPublishedAt(existing.publishedAt, nextStatus),
      updatedAt: new Date().toISOString()
    };
    this.sermons.set(id, updated);
    return updated;
  }

  async attachAudio(
    id: string,
    input: SermonAudioInput,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    const existing = this.sermons.get(id);
    if (!existing || !matchesRevision(existing, options)) {
      return null;
    }
    await this.scheduleAudioCleanup(id, options);
    await this.discardAudioCleanupCandidate(options);
    const updated: Sermon = {
      ...existing,
      revision: existing.revision + 1,
      audio: {
        url: input.url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: "ready",
        uploadedAt: input.uploadedAt.toISOString()
      },
      updatedAt: new Date().toISOString()
    };
    this.sermons.set(id, updated);
    this.audioRecords.set(id, {
      storagePath: input.storagePath,
      url: input.url,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAt: input.uploadedAt,
      status: "ready"
    });
    return updated;
  }

  async markAudioFailed(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    const existing = this.sermons.get(id);
    if (!existing || !matchesRevision(existing, options)) {
      return null;
    }
    const updated: Sermon = {
      ...existing,
      revision: existing.revision + 1,
      audio: {
        ...existing.audio,
        status: "failed"
      },
      updatedAt: new Date().toISOString()
    };
    this.sermons.set(id, updated);
    return updated;
  }

  async removeAudio(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    const existing = this.sermons.get(id);
    if (!existing || !matchesRevision(existing, options)) {
      return null;
    }
    await this.scheduleAudioCleanup(id, options);
    const updated: Sermon = {
      ...existing,
      revision: existing.revision + 1,
      audio: emptyAudio(),
      updatedAt: new Date().toISOString()
    };
    this.sermons.set(id, updated);
    this.audioRecords.delete(id);
    return updated;
  }

  async getAudioRecord(id: string): Promise<SermonAudioRecord | null> {
    return this.audioRecords.get(id) ?? null;
  }

  async delete(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<boolean> {
    const existing = this.sermons.get(id);
    if (!existing || !matchesRevision(existing, options)) {
      return false;
    }
    await this.scheduleAudioCleanup(id, options);
    this.audioRecords.delete(id);
    return this.sermons.delete(id);
  }

  private async scheduleAudioCleanup(
    sermonId: string,
    options: SermonUpdateOptions
  ) {
    if (!options.audioCleanup) {
      return;
    }
    if (!this.audioCleanupRepository) {
      throw new Error("Sermon audio cleanup repository is required.");
    }
    await this.audioCleanupRepository.schedule({
      sermonId,
      ...options.audioCleanup
    });
  }

  private async discardAudioCleanupCandidate(options: SermonUpdateOptions) {
    if (!options.audioCleanupCandidateStoragePath) {
      return;
    }
    if (!this.audioCleanupRepository) {
      throw new Error("Sermon audio cleanup repository is required.");
    }
    await this.audioCleanupRepository.discardByStoragePath(
      options.audioCleanupCandidateStoragePath
    );
  }
}

function matchesRevision(
  sermon: Sermon,
  options: SermonUpdateOptions
): boolean {
  return (
    options.expectedRevision === undefined ||
    options.expectedRevision === sermon.revision
  );
}

const seedSermons: Sermon[] = [
  {
    id: "sermon-romans-hope",
    revision: 0,
    sourceLocale: "en",
    title: "Hope in Suffering",
    speaker: "Pastor David Chen",
    sermonDate: "2026-05-03",
    series: "Romans",
    topics: ["Hope", "Suffering"],
    primaryReference: "Romans 8:18-30",
    summary:
      "A sermon on how the Spirit helps believers in weakness and forms hope through suffering.",
    durationSeconds: 2380,
    thumbnailUrl: null,
    audio: emptyAudio(),
    status: "published",
    publishedAt: "2026-05-03T18:00:00.000Z",
    outline: [
      {
        title: "Present suffering",
        startSeconds: 120,
        summary:
          "Paul does not deny suffering, but sets it beside future glory."
      },
      {
        title: "The Spirit helps",
        startSeconds: 840,
        summary:
          "The Spirit intercedes for believers when prayer feels impossible."
      }
    ],
    references: [
      {
        reference: "Romans 8:28",
        verseId: "rom.8.28",
        note: "Core sermon verse",
        startSeconds: 1500
      }
    ],
    transcript: {
      text: "",
      source: "seed",
      updatedAt: "2026-05-03T18:00:00.000Z"
    },
    reviewMarkdown: null,
    processingMetadata: null,
    createdAt: "2026-05-03T18:00:00.000Z",
    updatedAt: "2026-05-03T18:00:00.000Z"
  }
];

function emptyAudio(): Sermon["audio"] {
  return {
    url: null,
    fileName: null,
    mimeType: null,
    sizeBytes: 0,
    status: "missing",
    uploadedAt: null
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function nextPublishedAt(
  existingPublishedAt: string | null,
  status: Sermon["status"]
): string | null {
  if (status === "published" && existingPublishedAt === null) {
    return new Date().toISOString();
  }
  if (status !== "published") {
    return null;
  }
  return existingPublishedAt;
}

function sermonInRange(
  sermon: Sermon,
  from: string | undefined,
  to: string | undefined
) {
  if (!from && !to) {
    return true;
  }
  const sermonDate = new Date(sermon.sermonDate);
  if (Number.isNaN(sermonDate.valueOf())) {
    return false;
  }
  if (from && sermonDate < new Date(from)) {
    return false;
  }
  if (to && sermonDate >= new Date(to)) {
    return false;
  }
  return true;
}
