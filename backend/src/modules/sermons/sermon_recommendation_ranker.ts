import type {
  Sermon,
  SermonRecommendationQuery
} from "@mbc/api-contracts";

export function recommendationScore(
  sermon: Sermon,
  query: SermonRecommendationQuery
): number {
  let score = 0;
  for (const reference of sermon.references) {
    if (query.verseId && reference.verseId === query.verseId) {
      score = Math.max(score, 100);
      continue;
    }
    if (
      query.chapter &&
      reference.verseId.startsWith(`${query.bookId}.${query.chapter}.`)
    ) {
      score = Math.max(score, 70);
      continue;
    }
    if (!query.chapter && reference.verseId.startsWith(`${query.bookId}.`)) {
      score = Math.max(score, 40);
    }
  }
  return score;
}
