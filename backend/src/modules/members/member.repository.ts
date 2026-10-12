import type {
  MemberCreateRequest,
  MemberListItem,
  MemberListQuery,
  MemberNotificationSettings,
  MemberProfile,
  MemberUpdateRequest
} from "@mbc/api-contracts";

export class MemberEmailConflictRepositoryError extends Error {
  constructor(readonly email: string) {
    super("Member email already exists.");
    this.name = "MemberEmailConflictRepositoryError";
  }
}

export interface MemberRepository {
  list(query: MemberListQuery): Promise<MemberListItem[]>;
  listNotificationEligibleIds(
    preference: keyof MemberNotificationSettings,
    userIds?: string[]
  ): Promise<string[]>;
  getById(id: string): Promise<MemberProfile | null>;
  getByEmail(email: string): Promise<MemberProfile | null>;
  create(input: MemberCreateRequest): Promise<MemberProfile>;
  update(id: string, input: MemberUpdateRequest): Promise<MemberProfile | null>;
}
