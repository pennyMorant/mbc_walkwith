import type {
  SermonDiscoveryFacets,
  SermonListQuery,
  SermonRecommendationQuery
} from "@mbc/api-contracts";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  like,
  lt,
  or,
  sql
} from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  sermonReferences,
  sermonTopics,
  sermonTranscripts,
  sermons
} from "../../shared/db/schema.js";

export async function listSermonDiscoveryRows(
  db: AppDb,
  query: SermonListQuery
) {
  const bookSermonIds = query.bookId
    ? await sermonIdsForBook(db, query.bookId)
    : null;
  const topicSermonIds = query.topic
    ? await sermonIdsForTopic(db, query.topic)
    : null;
  if (bookSermonIds?.length === 0 || topicSermonIds?.length === 0) {
    return { rows: [], nextCursor: null };
  }

  const searchPattern = query.query ? containsPattern(query.query) : undefined;
  const filters = [
    query.status ? eq(sermons.status, query.status) : undefined,
    query.cursor ? lt(sermons.sermonDate, new Date(query.cursor)) : undefined,
    query.from ? gte(sermons.sermonDate, new Date(query.from)) : undefined,
    query.to ? lt(sermons.sermonDate, new Date(query.to)) : undefined,
    query.speaker ? eq(sermons.speaker, query.speaker) : undefined,
    query.series ? eq(sermons.series, query.series) : undefined,
    bookSermonIds ? inArray(sermons.id, bookSermonIds) : undefined,
    topicSermonIds ? inArray(sermons.id, topicSermonIds) : undefined,
    searchPattern ? sermonSearchFilter(db, searchPattern) : undefined
  ].filter((filter) => filter !== undefined);

  const rows = await db
    .select()
    .from(sermons)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(sermons.sermonDate))
    .limit(query.limit + 1);
  return {
    rows: rows.slice(0, query.limit),
    nextCursor:
      rows.length > query.limit
        ? rows[query.limit]?.sermonDate.toISOString() ?? null
        : null
  };
}

export async function rankedSermonRecommendationIds(
  db: AppDb,
  query: SermonRecommendationQuery
): Promise<string[]> {
  const score = recommendationScoreExpression(query);
  const referencePattern = query.chapter
    ? prefixPattern(`${query.bookId}.${query.chapter}`)
    : prefixPattern(query.bookId);
  const rows = await db
    .select({ id: sermons.id, score })
    .from(sermons)
    .innerJoin(sermonReferences, eq(sermonReferences.sermonId, sermons.id))
    .where(
      and(
        eq(sermons.status, "published"),
        like(sermonReferences.verseId, referencePattern)
      )
    )
    .groupBy(sermons.id, sermons.sermonDate)
    .orderBy(desc(score), desc(sermons.sermonDate))
    .limit(query.limit);
  return rows.map((row) => row.id);
}

export async function readSermonDiscoveryFacets(
  db: AppDb
): Promise<SermonDiscoveryFacets> {
  const [speakerRows, seriesRows, topicRows] = await Promise.all([
    db
      .selectDistinct({ value: sermons.speaker })
      .from(sermons)
      .where(eq(sermons.status, "published"))
      .orderBy(asc(sermons.speaker)),
    db
      .selectDistinct({ value: sermons.series })
      .from(sermons)
      .where(and(eq(sermons.status, "published"), isNotNull(sermons.series)))
      .orderBy(asc(sermons.series)),
    db
      .selectDistinct({ value: sermonTopics.topic })
      .from(sermonTopics)
      .innerJoin(sermons, eq(sermons.id, sermonTopics.sermonId))
      .where(eq(sermons.status, "published"))
      .orderBy(asc(sermonTopics.topic))
  ]);
  return {
    speakers: speakerRows.map((row) => row.value),
    series: seriesRows.flatMap((row) => (row.value ? [row.value] : [])),
    topics: topicRows.map((row) => row.value)
  };
}

function sermonSearchFilter(db: AppDb, searchPattern: string) {
  return or(
    ilike(sermons.title, searchPattern),
    ilike(sermons.speaker, searchPattern),
    ilike(sermons.series, searchPattern),
    ilike(sermons.primaryReference, searchPattern),
    ilike(sermons.summary, searchPattern),
    exists(
      db
        .select({ sermonId: sermonTranscripts.sermonId })
        .from(sermonTranscripts)
        .where(
          and(
            eq(sermonTranscripts.sermonId, sermons.id),
            ilike(sermonTranscripts.text, searchPattern)
          )
        )
    ),
    exists(
      db
        .select({ sermonId: sermonTopics.sermonId })
        .from(sermonTopics)
        .where(
          and(
            eq(sermonTopics.sermonId, sermons.id),
            ilike(sermonTopics.topic, searchPattern)
          )
        )
    ),
    exists(
      db
        .select({ sermonId: sermonReferences.sermonId })
        .from(sermonReferences)
        .where(
          and(
            eq(sermonReferences.sermonId, sermons.id),
            or(
              ilike(sermonReferences.referenceText, searchPattern),
              ilike(sermonReferences.note, searchPattern)
            )
          )
        )
    )
  );
}

async function sermonIdsForBook(db: AppDb, bookId: string): Promise<string[]> {
  const rows = await db
    .select({ sermonId: sermonReferences.sermonId })
    .from(sermonReferences)
    .where(like(sermonReferences.verseId, prefixPattern(bookId)));
  return [...new Set(rows.map((row) => row.sermonId))];
}

async function sermonIdsForTopic(db: AppDb, topic: string): Promise<string[]> {
  const rows = await db
    .select({ sermonId: sermonTopics.sermonId })
    .from(sermonTopics)
    .where(eq(sermonTopics.topic, topic));
  return [...new Set(rows.map((row) => row.sermonId))];
}

function recommendationScoreExpression(query: SermonRecommendationQuery) {
  const chapterPattern = query.chapter
    ? prefixPattern(`${query.bookId}.${query.chapter}`)
    : null;
  if (query.verseId && chapterPattern) {
    return sql<number>`max(case
      when ${sermonReferences.verseId} = ${query.verseId} then 100
      when ${sermonReferences.verseId} like ${chapterPattern} then 70
      else 0
    end)`;
  }
  if (query.verseId) {
    return sql<number>`max(case
      when ${sermonReferences.verseId} = ${query.verseId} then 100
      else 40
    end)`;
  }
  if (chapterPattern) {
    return sql<number>`max(case
      when ${sermonReferences.verseId} like ${chapterPattern} then 70
      else 0
    end)`;
  }
  return sql<number>`40`;
}

function containsPattern(value: string): string {
  return `%${escapeLikePattern(value.trim())}%`;
}

function prefixPattern(value: string): string {
  return `${escapeLikePattern(value)}.%`;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
