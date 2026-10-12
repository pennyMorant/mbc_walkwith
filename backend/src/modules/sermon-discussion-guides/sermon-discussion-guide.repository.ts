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

export type SermonDiscussionViewer = {
  userType: "member" | "external";
  userId: string;
};

export class SermonDiscussionPublicGuideConflictError extends Error {
  constructor(readonly sermonId: string) {
    super("A public discussion guide is already published for this sermon.");
    this.name = "SermonDiscussionPublicGuideConflictError";
  }
}

export interface SermonDiscussionGuideRepository {
  listGuides(
    query: SermonDiscussionGuideListQuery
  ): Promise<SermonDiscussionGuide[]>;
  getGuideById(id: string): Promise<SermonDiscussionGuide | null>;
  getPublishedGuideBySermonId(
    sermonId: string
  ): Promise<SermonDiscussionGuide | null>;
  createGuide(
    input: SermonDiscussionGuideCreateRequest
  ): Promise<SermonDiscussionGuide>;
  updateGuide(
    id: string,
    input: SermonDiscussionGuideUpdateRequest
  ): Promise<SermonDiscussionGuide | null>;
  listResponses(
    query: SermonDiscussionResponseListQuery
  ): Promise<SermonDiscussionResponse[]>;
  getResponseById(id: string): Promise<SermonDiscussionResponse | null>;
  createResponse(
    guideId: string,
    viewer: SermonDiscussionViewer,
    input: SermonDiscussionResponseCreateRequest
  ): Promise<SermonDiscussionResponse>;
  updateResponseStatus(
    id: string,
    status: SermonDiscussionResponseStatus
  ): Promise<SermonDiscussionResponse | null>;
}
