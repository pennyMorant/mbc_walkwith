import type {
  NewcomerCreateRequest,
  NewcomerFollowUp,
  NewcomerFollowUpCreateRequest,
  NewcomerListQuery,
  NewcomerProfile,
  NewcomerUpdateRequest
} from "@mbc/api-contracts";

export interface NewcomerRepository {
  list(query: NewcomerListQuery): Promise<NewcomerProfile[]>;
  getById(id: string): Promise<NewcomerProfile | null>;
  create(input: NewcomerCreateRequest): Promise<NewcomerProfile>;
  update(
    id: string,
    input: NewcomerUpdateRequest
  ): Promise<NewcomerProfile | null>;
  listFollowUps(newcomerId: string): Promise<NewcomerFollowUp[]>;
  createFollowUp(input: NewcomerFollowUpCreateInputWithAuthor): Promise<NewcomerFollowUp>;
}

export type NewcomerFollowUpCreateInputWithAuthor =
  NewcomerFollowUpCreateRequest & {
    newcomerId: string;
    authorAdminUserId: string | null;
    authorName: string;
  };
