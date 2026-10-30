import type {
  BibleKnowledgeEntity,
  BibleKnowledgeEntityType,
  BibleKnowledgeSection,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

import type { BibleKnowledgeListFilters } from "@/core/api/bible_knowledge";

export type BibleKnowledgeTranslationId = "web" | "cuvs" | "cuvt";

export type BibleKnowledgeFilterForm = {
  query: string;
  type: BibleKnowledgeEntityType | "";
  status: BibleKnowledgeEntity["status"] | "";
  locale: string;
  translationId: BibleKnowledgeTranslationId;
};

export type BibleKnowledgeEditorForm = {
  id: string;
  type: BibleKnowledgeEntityType;
  name: string;
  category: string;
  summary: string;
  description: string;
  sections: BibleKnowledgeSection[];
  aliasesText: string;
  verseAliasesText: string;
  status: BibleKnowledgeEntity["status"];
};

export type BibleKnowledgeEntityKey = Pick<
  BibleKnowledgeEntity,
  "id" | "locale" | "translationId"
>;

type BibleKnowledgeContentPayload = Omit<
  BibleKnowledgeUpsertRequest,
  "id" | "locale" | "translationId"
>;

export type BibleKnowledgeEditorContext = {
  entityKey: BibleKnowledgeEntityKey | null;
  locale: string;
  translationId: string;
};

export function createBibleKnowledgeFilterForm(): BibleKnowledgeFilterForm {
  return {
    query: "",
    type: "",
    status: "",
    locale: "en",
    translationId: "web"
  };
}

export function bibleKnowledgeFilterSnapshot(
  filters: BibleKnowledgeFilterForm
): BibleKnowledgeListFilters {
  return {
    query: filters.query.trim(),
    type: filters.type,
    status: filters.status,
    locale: filters.locale.trim() || "en",
    translationId: filters.translationId,
    limit: 50
  };
}

export function sameBibleKnowledgeFilters(
  current: BibleKnowledgeListFilters,
  next: BibleKnowledgeListFilters
) {
  return (
    current.query === next.query &&
    current.type === next.type &&
    current.status === next.status &&
    current.locale === next.locale &&
    current.translationId === next.translationId &&
    current.limit === next.limit
  );
}

export function createBibleKnowledgeEditorForm(): BibleKnowledgeEditorForm {
  return {
    id: "",
    type: "person",
    name: "",
    category: "",
    summary: "",
    description: "",
    sections: [createBibleKnowledgeSection()],
    aliasesText: "",
    verseAliasesText: "{}",
    status: "draft"
  };
}

export function fillBibleKnowledgeEditorForm(
  form: BibleKnowledgeEditorForm,
  entity: BibleKnowledgeEntity
) {
  form.id = entity.id;
  form.type = entity.type;
  form.name = entity.name;
  form.category = entity.category;
  form.summary = entity.summary;
  form.description = entity.description;
  form.sections = entity.sections.length
    ? entity.sections.map((section) => ({ ...section }))
    : [
        {
          type: "overview",
          title: "Overview",
          body: entity.description
        }
      ];
  form.aliasesText = entity.aliases.join("\n");
  form.verseAliasesText = JSON.stringify(entity.verseAliases, null, 2);
  form.status = entity.status;
}

export function resetBibleKnowledgeEditorForm(form: BibleKnowledgeEditorForm) {
  Object.assign(form, createBibleKnowledgeEditorForm());
}

export function createBibleKnowledgeSection(): BibleKnowledgeSection {
  return { type: "overview", title: "Overview", body: "" };
}

export function moveBibleKnowledgeSection(
  sections: BibleKnowledgeSection[],
  index: number,
  direction: -1 | 1
) {
  const nextIndex = index + direction;
  const current = sections[index];
  const next = sections[nextIndex];
  if (!current || !next) return;
  sections[index] = next;
  sections[nextIndex] = current;
}

export function canSubmitBibleKnowledgeEntity(
  canManage: boolean,
  form: BibleKnowledgeEditorForm
) {
  return (
    canManage &&
    form.id.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.category.trim().length > 0
  );
}

export function bibleKnowledgeUpsertPayload(
  form: BibleKnowledgeEditorForm,
  context: Pick<BibleKnowledgeListFilters, "locale" | "translationId">,
  invalidVerseAliasesMessage: string
): BibleKnowledgeUpsertRequest {
  return {
    id: form.id.trim(),
    locale: context.locale?.trim() || "en",
    translationId: context.translationId ?? "web",
    ...bibleKnowledgeContentPayload(form, invalidVerseAliasesMessage)
  };
}

export function bibleKnowledgeUpdatePayload(
  form: BibleKnowledgeEditorForm,
  invalidVerseAliasesMessage: string
): BibleKnowledgeUpdateRequest {
  return bibleKnowledgeContentPayload(form, invalidVerseAliasesMessage);
}

function bibleKnowledgeContentPayload(
  form: BibleKnowledgeEditorForm,
  invalidVerseAliasesMessage: string
): BibleKnowledgeContentPayload {
  return {
    type: form.type,
    name: form.name.trim(),
    category: form.category.trim(),
    summary: form.summary.trim(),
    description: form.description.trim(),
    sections: form.sections
      .map((section) => ({
        type: section.type.trim() || "overview",
        title: section.title.trim() || "Overview",
        body: section.body.trim()
      }))
      .filter((section) => section.body.length > 0),
    aliases: form.aliasesText
      .split(/\n|,/)
      .map((alias) => alias.trim())
      .filter(Boolean),
    verseAliases: parseBibleKnowledgeVerseAliases(
      form.verseAliasesText,
      invalidVerseAliasesMessage
    ),
    status: form.status
  };
}

export function bibleKnowledgeEntityKey(
  entity: BibleKnowledgeEntity
): BibleKnowledgeEntityKey {
  return {
    id: entity.id,
    locale: entity.locale,
    translationId: entity.translationId
  };
}

export function bibleKnowledgeEditorContext(
  entity: BibleKnowledgeEntity | null,
  filters: Pick<BibleKnowledgeListFilters, "locale" | "translationId">
): BibleKnowledgeEditorContext {
  const entityKey = entity ? bibleKnowledgeEntityKey(entity) : null;
  return {
    entityKey,
    locale: entityKey?.locale ?? filters.locale ?? "en",
    translationId: entityKey?.translationId ?? filters.translationId ?? "web"
  };
}

export function sameBibleKnowledgeEditorContext(
  current: BibleKnowledgeEditorContext,
  command: BibleKnowledgeEditorContext
) {
  return (
    sameBibleKnowledgeEntityKey(current.entityKey, command.entityKey) &&
    current.locale === command.locale &&
    current.translationId === command.translationId
  );
}

function sameBibleKnowledgeEntityKey(
  current: BibleKnowledgeEntityKey | null,
  command: BibleKnowledgeEntityKey | null
) {
  if (!current || !command) return current === command;
  return (
    current.id === command.id &&
    current.locale === command.locale &&
    current.translationId === command.translationId
  );
}

function parseBibleKnowledgeVerseAliases(
  value: string,
  invalidMessage: string
): Record<string, string[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value.trim() || "{}");
  } catch {
    throw new Error(invalidMessage);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).map(([verseId, aliases]) => [
      verseId,
      Array.isArray(aliases)
        ? aliases
            .filter((alias): alias is string => typeof alias === "string")
            .map((alias) => alias.trim())
            .filter(Boolean)
        : []
    ])
  );
}
