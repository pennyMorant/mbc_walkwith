import type {
  CareFollowUp,
  CareFollowUpCreateRequest,
  CareRequestAdmin,
  CareRequestCreateRequest,
  CareRequestListQuery,
  CareRequestStatus,
  CareRequestSummary,
  CareRequestUpdateRequest,
  MemberCareRequestListQuery
} from "@mbc/api-contracts";

export interface CareRepository {
  list(query: CareRequestListQuery): Promise<CareRequestAdmin[]>;
  listForUser(
    userId: string,
    query: MemberCareRequestListQuery
  ): Promise<CareRequestSummary[]>;
  getById(id: string): Promise<CareRequestAdmin | null>;
  create(input: CareRequestCreateInput): Promise<CareRequestSummary>;
  update(
    id: string,
    input: CareRequestUpdateInput,
    expectedVersion: number
  ): Promise<CareRequestAdmin | null>;
  listFollowUps(careRequestId: string): Promise<CareFollowUp[]>;
  createFollowUp(
    input: CareFollowUpCreateInput,
    expectedRequestVersion: number,
    transition?: CareRequestStatusTransition
  ): Promise<CareFollowUp | null>;
}

export type CareRequestCreateInput = CareRequestCreateRequest & {
  userId: string;
  memberDisplayName: string;
  memberEmail: string;
};

export type CareFollowUpCreateInput = CareFollowUpCreateRequest & {
  careRequestId: string;
  authorAdminUserId: string | null;
  authorName: string;
};

export type CareRequestUpdateInput = CareRequestUpdateRequest & {
  assigneeName?: string;
};

export type CareRequestStatusTransition = {
  expectedStatus: CareRequestStatus;
  nextStatus: CareRequestStatus;
};
