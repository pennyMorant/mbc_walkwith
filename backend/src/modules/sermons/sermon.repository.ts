import type {
  CreateLocalSermonDraftRequest,
  SermonDiscoveryFacets,
  SermonAudioCleanupReason,
  Sermon,
  SermonListQuery,
  SermonRecommendationQuery,
  SermonStatus,
  UpdateSermonRequest
} from "@mbc/api-contracts";

export type SermonListResult = {
  sermons: Sermon[];
  nextCursor: string | null;
};

export type SermonAudioInput = {
  storagePath: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
};

export type SermonAudioRecord = SermonAudioInput & {
  status: "missing" | "ready" | "failed";
};

export type SermonUpdateOptions = {
  expectedRevision?: number;
  audioCleanupCandidateStoragePath?: string;
  audioCleanup?: {
    storagePath: string;
    reason: SermonAudioCleanupReason;
  };
};

export interface SermonRepository {
  list(query: SermonListQuery): Promise<SermonListResult>;
  countByStatus(status: SermonStatus): Promise<number>;
  recommendations(query: SermonRecommendationQuery): Promise<Sermon[]>;
  discoveryFacets(): Promise<SermonDiscoveryFacets>;
  getById(id: string): Promise<Sermon | null>;
  createDraft(input: CreateLocalSermonDraftRequest): Promise<Sermon>;
  update(
    id: string,
    input: UpdateSermonRequest,
    options?: SermonUpdateOptions
  ): Promise<Sermon | null>;
  attachAudio(
    id: string,
    input: SermonAudioInput,
    options?: SermonUpdateOptions
  ): Promise<Sermon | null>;
  markAudioFailed(
    id: string,
    options?: SermonUpdateOptions
  ): Promise<Sermon | null>;
  removeAudio(
    id: string,
    options?: SermonUpdateOptions
  ): Promise<Sermon | null>;
  getAudioRecord(id: string): Promise<SermonAudioRecord | null>;
  delete(id: string, options?: SermonUpdateOptions): Promise<boolean>;
}
