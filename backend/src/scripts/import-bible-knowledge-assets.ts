import { bibleKnowledgeStatusSchema } from "@mbc/api-contracts";

import { loadConfig } from "../config/env.js";
import {
  loadBibleKnowledgeAssetEntities,
  summarizeBibleKnowledgeAssetImport
} from "../modules/bible-knowledge/bible-knowledge-asset-importer.js";
import { PostgresBibleKnowledgeRepository } from "../modules/bible-knowledge/postgres-bible-knowledge.repository.js";
import { createManagedDb } from "../shared/db/client.js";

const config = loadConfig();

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required to import Bible knowledge assets.");
}

const rows = await loadBibleKnowledgeAssetEntities({
  ...(process.env.BIBLE_KNOWLEDGE_ASSET_DIR
    ? { assetDir: process.env.BIBLE_KNOWLEDGE_ASSET_DIR }
    : {}),
  status: bibleKnowledgeStatusSchema
    .default("published")
    .parse(process.env.BIBLE_KNOWLEDGE_IMPORT_STATUS)
});
const planned = summarizeBibleKnowledgeAssetImport(rows);
const managed = createManagedDb(config.databaseUrl);
const repository = new PostgresBibleKnowledgeRepository(managed.db);

let created = 0;
let updated = 0;

try {
  for (const row of rows) {
    const key = {
      id: row.id,
      locale: row.locale,
      translationId: row.translationId
    };
    const existing = await repository.getByKey(key);
    if (existing) {
      await repository.update(key, {
        type: row.type,
        name: row.name,
        category: row.category,
        summary: row.summary,
        description: row.description,
        sections: row.sections,
        aliases: row.aliases,
        verseAliases: row.verseAliases,
        status: row.status
      });
      updated += 1;
    } else {
      await repository.create(row);
      created += 1;
    }
  }

  console.log("bible knowledge import complete", {
    created,
    updated,
    ...planned
  });
} finally {
  await managed.close();
}
