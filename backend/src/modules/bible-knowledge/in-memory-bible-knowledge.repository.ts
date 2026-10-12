import type {
  BibleKnowledgeEntity,
  BibleKnowledgeListQuery,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

import type { BibleKnowledgeRepository } from "./bible-knowledge.repository.js";

export class InMemoryBibleKnowledgeRepository
  implements BibleKnowledgeRepository
{
  private entities = new Map<string, BibleKnowledgeEntity>(
    seedEntities.map((entity) => [entityKey(entity), entity])
  );

  async list(query: BibleKnowledgeListQuery): Promise<BibleKnowledgeEntity[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.entities.values()]
      .filter((entity) => {
        if (entity.locale !== query.locale) {
          return false;
        }
        if (entity.translationId !== query.translationId) {
          return false;
        }
        if (entity.type !== query.type && query.type) {
          return false;
        }
        if (entity.status !== query.status && query.status) {
          return false;
        }
        if (normalizedQuery) {
          const haystack = [
            entity.id,
            entity.type,
            entity.name,
            entity.category,
            entity.summary,
            entity.description,
            entity.aliases.join(" ")
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        }
        return true;
      })
      .slice(0, query.limit);
  }

  async getByKey(input: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<BibleKnowledgeEntity | null> {
    return this.entities.get(entityKey(input)) ?? null;
  }

  async create(
    input: BibleKnowledgeUpsertRequest
  ): Promise<BibleKnowledgeEntity> {
    const entity = entityFromInput(input);
    this.entities.set(entityKey(input), entity);
    return entity;
  }

  async update(
    key: { id: string; locale: string; translationId: string },
    input: BibleKnowledgeUpdateRequest
  ): Promise<BibleKnowledgeEntity | null> {
    const existing = this.entities.get(entityKey(key));
    if (!existing) {
      return null;
    }
    const updated: BibleKnowledgeEntity = {
      ...existing,
      type: input.type ?? existing.type,
      name: input.name ?? existing.name,
      category: input.category ?? existing.category,
      summary: input.summary ?? existing.summary,
      description: input.description ?? existing.description,
      sections: input.sections ?? existing.sections,
      aliases: input.aliases ?? existing.aliases,
      verseAliases: input.verseAliases ?? existing.verseAliases,
      status: input.status ?? existing.status
    };
    this.entities.set(entityKey(key), updated);
    return updated;
  }

  async delete(key: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<boolean> {
    return this.entities.delete(entityKey(key));
  }
}

function entityFromInput(
  input: BibleKnowledgeUpsertRequest
): BibleKnowledgeEntity {
  return {
    id: input.id,
    type: input.type,
    locale: input.locale,
    translationId: input.translationId,
    name: input.name,
    category: input.category,
    summary: input.summary,
    description: input.description,
    sections: input.sections,
    aliases: input.aliases,
    verseAliases: input.verseAliases,
    status: input.status
  };
}

function entityKey(input: {
  id: string;
  locale?: string;
  translationId?: string;
}) {
  return `${input.id}:${input.locale ?? "en"}:${input.translationId ?? "web"}`;
}

const seedEntities: BibleKnowledgeEntity[] = [
  {
    id: "jesus",
    type: "person",
    locale: "en",
    translationId: "web",
    name: "Jesus",
    category: "Messiah and Son of God",
    summary: "Jesus is the center of the Gospel narratives.",
    description:
      "Jesus Christ is the central person of the New Testament, crucified and risen for salvation.",
    sections: [
      {
        type: "overview",
        title: "Overview",
        body: "Jesus Christ is the central person of the New Testament, crucified and risen for salvation."
      }
    ],
    aliases: ["Jesus Christ", "Christ Jesus", "Jesus", "Christ"],
    verseAliases: {},
    status: "published"
  },
  {
    id: "jerusalem",
    type: "place",
    locale: "en",
    translationId: "web",
    name: "Jerusalem",
    category: "City and temple center",
    summary: "Jerusalem marks worship, conflict, judgment, and witness.",
    description:
      "Jerusalem was the central city of Jewish worship and public life in many New Testament passages.",
    sections: [
      {
        type: "overview",
        title: "Overview",
        body: "Jerusalem was the central city of Jewish worship and public life in many New Testament passages."
      }
    ],
    aliases: ["Jerusalem"],
    verseAliases: {},
    status: "published"
  }
];
