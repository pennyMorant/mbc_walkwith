import type {
  BibleKnowledgeEntity,
  BibleKnowledgeListQuery,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

export interface BibleKnowledgeRepository {
  list(query: BibleKnowledgeListQuery): Promise<BibleKnowledgeEntity[]>;
  getByKey(input: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<BibleKnowledgeEntity | null>;
  create(input: BibleKnowledgeUpsertRequest): Promise<BibleKnowledgeEntity>;
  update(
    key: { id: string; locale: string; translationId: string },
    input: BibleKnowledgeUpdateRequest
  ): Promise<BibleKnowledgeEntity | null>;
  delete(key: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<boolean>;
}
