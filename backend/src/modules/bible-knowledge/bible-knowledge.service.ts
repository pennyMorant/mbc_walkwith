import type {
  BibleKnowledgeListQuery,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

import type { BibleKnowledgeRepository } from "./bible-knowledge.repository.js";

export class BibleKnowledgeService {
  constructor(private readonly repository: BibleKnowledgeRepository) {}

  list(query: BibleKnowledgeListQuery) {
    return this.repository.list(query);
  }

  getByKey(input: { id: string; locale: string; translationId: string }) {
    return this.repository.getByKey(input);
  }

  create(input: BibleKnowledgeUpsertRequest) {
    return this.repository.create(input);
  }

  update(
    key: { id: string; locale: string; translationId: string },
    input: BibleKnowledgeUpdateRequest
  ) {
    return this.repository.update(key, input);
  }

  delete(key: { id: string; locale: string; translationId: string }) {
    return this.repository.delete(key);
  }
}
