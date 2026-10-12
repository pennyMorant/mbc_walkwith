import type { UpdateSermonRequest } from "@mbc/api-contracts";
import { eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  sermonOutlines,
  sermonReferences,
  sermonTopics,
  sermonTranscripts
} from "../../shared/db/schema.js";

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export async function replaceSermonChildren(
  transaction: AppTransaction,
  sermonId: string,
  input: UpdateSermonRequest,
  updatedAt: Date
) {
  if (input.outline) {
    await transaction
      .delete(sermonOutlines)
      .where(eq(sermonOutlines.sermonId, sermonId));
    if (input.outline.length > 0) {
      await transaction.insert(sermonOutlines).values(
        input.outline.map((outline, index) => ({
          sermonId,
          title: outline.title,
          summary: outline.summary,
          startSeconds: outline.startSeconds,
          sortOrder: index
        }))
      );
    }
  }

  if (input.references) {
    await transaction
      .delete(sermonReferences)
      .where(eq(sermonReferences.sermonId, sermonId));
    if (input.references.length > 0) {
      await transaction.insert(sermonReferences).values(
        input.references.map((reference) => ({
          sermonId,
          verseId: reference.verseId,
          referenceText: reference.reference,
          note: reference.note,
          startSeconds: reference.startSeconds ?? null
        }))
      );
    }
  }

  if (input.topics) {
    await transaction
      .delete(sermonTopics)
      .where(eq(sermonTopics.sermonId, sermonId));
    if (input.topics.length > 0) {
      await transaction.insert(sermonTopics).values(
        input.topics.map((topic) => ({
          sermonId,
          topic
        }))
      );
    }
  }

  if (input.transcript !== undefined) {
    await transaction
      .delete(sermonTranscripts)
      .where(eq(sermonTranscripts.sermonId, sermonId));
    if (input.transcript !== null) {
      await transaction.insert(sermonTranscripts).values({
        sermonId,
        text: input.transcript.text,
        source: input.transcript.source,
        updatedAt
      });
    }
  }
}
