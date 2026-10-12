import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  bibleKnowledgeUpsertRequestSchema,
  type BibleKnowledgeEntity,
  type BibleKnowledgeEntityType,
  type BibleKnowledgeSection,
  type BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

type TranslationVariant = {
  translationId: "web" | "cuvs" | "cuvt";
  locale: string;
  suffix: "En" | "ZhHans" | "ZhHant";
};

type BibleKnowledgeAssetRow = Record<string, unknown>;

export type BibleKnowledgeAssetImportInput = {
  people: unknown;
  places: unknown;
  status?: BibleKnowledgeEntity["status"];
};

export type BibleKnowledgeAssetLoadOptions = {
  assetDir?: string;
  status?: BibleKnowledgeEntity["status"];
};

export type BibleKnowledgeAssetImportSummary = {
  total: number;
  byType: Record<BibleKnowledgeEntityType, number>;
  byTranslation: Record<TranslationVariant["translationId"], number>;
};

const translationVariants: TranslationVariant[] = [
  { translationId: "web", locale: "en", suffix: "En" },
  { translationId: "cuvs", locale: "zh-Hans", suffix: "ZhHans" },
  { translationId: "cuvt", locale: "zh-Hant", suffix: "ZhHant" }
];

export async function loadBibleKnowledgeAssetEntities(
  options: BibleKnowledgeAssetLoadOptions = {}
) {
  const assetDir = options.assetDir ?? (await findDefaultAssetDir());
  const [people, places] = await Promise.all([
    readJson(resolve(assetDir, "people.json")),
    readJson(resolve(assetDir, "places.json"))
  ]);

  return buildBibleKnowledgeEntitiesFromAssets({
    people,
    places,
    ...(options.status ? { status: options.status } : {})
  });
}

export function buildBibleKnowledgeEntitiesFromAssets(
  input: BibleKnowledgeAssetImportInput
): BibleKnowledgeUpsertRequest[] {
  const status = input.status ?? "published";
  const rows = [
    ...assetRows(input.people).flatMap((row) =>
      buildEntityRows(row, "person", status)
    ),
    ...assetRows(input.places).flatMap((row) =>
      buildEntityRows(row, "place", status)
    )
  ];

  return rows.map((row) => bibleKnowledgeUpsertRequestSchema.parse(row));
}

export function summarizeBibleKnowledgeAssetImport(
  rows: BibleKnowledgeUpsertRequest[]
): BibleKnowledgeAssetImportSummary {
  return rows.reduce<BibleKnowledgeAssetImportSummary>(
    (summary, row) => {
      summary.total += 1;
      summary.byType[row.type] += 1;
      summary.byTranslation[row.translationId] += 1;
      return summary;
    },
    {
      total: 0,
      byType: { person: 0, place: 0 },
      byTranslation: { web: 0, cuvs: 0, cuvt: 0 }
    }
  );
}

function buildEntityRows(
  row: BibleKnowledgeAssetRow,
  type: BibleKnowledgeEntityType,
  status: BibleKnowledgeEntity["status"]
) {
  return translationVariants.map((variant) => {
    const name = localizedString(row, "name", variant.suffix);
    const category =
      type === "person"
        ? localizedString(row, "role", variant.suffix)
        : localizedString(row, "category", variant.suffix);
    const description = localizedString(row, "description", variant.suffix);
    const summary =
      optionalLocalizedString(row, "summary", variant.suffix) ?? description;

    return {
      id: requiredString(row.id, "id"),
      type,
      locale: variant.locale,
      translationId: variant.translationId,
      name,
      category,
      summary,
      description,
      sections: localizedSections(row.sections, variant, description),
      aliases: localizedAliases(row.aliases, variant.translationId),
      verseAliases: localizedVerseAliases(row.verseAliases, variant.translationId),
      status
    };
  });
}

function assetRows(value: unknown): BibleKnowledgeAssetRow[] {
  if (!Array.isArray(value)) {
    throw new Error("Bible knowledge asset file must contain an array.");
  }
  return value.filter(
    (item): item is BibleKnowledgeAssetRow =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}

function localizedString(
  row: BibleKnowledgeAssetRow,
  baseKey: string,
  suffix: TranslationVariant["suffix"]
) {
  return requiredString(row[`${baseKey}${suffix}`], `${baseKey}${suffix}`);
}

function optionalLocalizedString(
  row: BibleKnowledgeAssetRow,
  baseKey: string,
  suffix: TranslationVariant["suffix"]
) {
  const value = row[`${baseKey}${suffix}`];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function localizedSections(
  value: unknown,
  variant: TranslationVariant,
  fallbackBody: string
): BibleKnowledgeSection[] {
  if (!Array.isArray(value)) {
    return [
      {
        type: "overview",
        title: fallbackSectionTitle(variant.suffix),
        body: fallbackBody
      }
    ];
  }

  const sections = value
    .filter(
      (item): item is BibleKnowledgeAssetRow =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item)
    )
    .map((section) => ({
      type: stringOrDefault(section.type, "overview"),
      title:
        optionalLocalizedString(section, "title", variant.suffix) ??
        fallbackSectionTitle(variant.suffix),
      body: optionalLocalizedString(section, "body", variant.suffix) ?? fallbackBody
    }))
    .filter((section) => section.body.trim());

  return sections.length > 0
    ? sections
    : [
        {
          type: "overview",
          title: fallbackSectionTitle(variant.suffix),
          body: fallbackBody
        }
      ];
}

function localizedAliases(
  value: unknown,
  translationId: TranslationVariant["translationId"]
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  const rawAliases = (value as Record<string, unknown>)[translationId];
  return stringArray(rawAliases);
}

function localizedVerseAliases(
  value: unknown,
  translationId: TranslationVariant["translationId"]
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([verseId, aliasesByTranslation]) => {
        if (
          !aliasesByTranslation ||
          typeof aliasesByTranslation !== "object" ||
          Array.isArray(aliasesByTranslation)
        ) {
          return [verseId, []];
        }
        return [
          verseId,
          stringArray(
            (aliasesByTranslation as Record<string, unknown>)[translationId]
          )
        ];
      }
    )
  );
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Bible knowledge asset field ${field} is required.`);
  }
  return value.trim();
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function fallbackSectionTitle(suffix: TranslationVariant["suffix"]) {
  return {
    En: "Overview",
    ZhHans: "简介",
    ZhHant: "簡介"
  }[suffix];
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function findDefaultAssetDir() {
  const candidates = [
    resolve(process.cwd(), "apps/mobile/assets/bible_knowledge"),
    resolve(process.cwd(), "../apps/mobile/assets/bible_knowledge")
  ];

  for (const candidate of candidates) {
    try {
      await access(resolve(candidate, "people.json"));
      await access(resolve(candidate, "places.json"));
      return candidate;
    } catch {
      // Try the next common workspace cwd.
    }
  }

  throw new Error(
    "Bible knowledge assets not found. Set BIBLE_KNOWLEDGE_ASSET_DIR."
  );
}
