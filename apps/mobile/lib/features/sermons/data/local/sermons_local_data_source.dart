import 'package:drift/drift.dart';

import '../../../../core/database/app_database.dart';
import '../../domain/sermon_list_request.dart';
import '../dto/sermon_discovery_facets_dto.dart';
import '../dto/sermon_dto.dart';
import 'sermon_cache_mapper.dart';
import 'sermon_cache_writer.dart';

class SermonsLocalDataSource {
  const SermonsLocalDataSource({required this.database});

  final AppDatabase database;

  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    final sermonQuery = database.select(database.localSermons)
      ..orderBy([(sermon) => OrderingTerm.desc(sermon.sermonDate)]);
    final sermons = await sermonQuery.get();
    if (sermons.isEmpty) {
      return const [];
    }
    final mapped = await _loadSermons(sermons);

    return mapped
        .where((sermon) => matchesCachedSermon(sermon, request))
        .take(request.limit)
        .toList(growable: false);
  }

  Future<SermonDto?> fetchSermonById(String sermonId) async {
    final row =
        await (database.select(database.localSermons)
              ..where((sermon) => sermon.id.equals(sermonId))
              ..limit(1))
            .getSingleOrNull();
    if (row == null) {
      return null;
    }
    return _loadSermon(row);
  }

  Future<void> deleteSermon(String sermonId) async {
    await database.transaction(() async {
      await (database.delete(
        database.localSermonReferences,
      )..where((reference) => reference.sermonId.equals(sermonId))).go();
      await (database.delete(
        database.localSermonOutlines,
      )..where((outline) => outline.sermonId.equals(sermonId))).go();
      await (database.delete(
        database.localSermonTopics,
      )..where((topic) => topic.sermonId.equals(sermonId))).go();
      await (database.delete(
        database.localSermons,
      )..where((sermon) => sermon.id.equals(sermonId))).go();
    });
  }

  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async {
    final rows = await database.select(database.localSermons).get();
    final sermons = await _loadSermons(rows);
    return cachedSermonFacets(sermons);
  }

  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    final rows = await (database.select(
      database.localSermons,
    )..orderBy([(sermon) => OrderingTerm.desc(sermon.sermonDate)])).get();
    final sermons = await _loadSermons(rows);
    final prefix = '$bookId.$chapter.';
    final scored =
        sermons
            .map(
              (sermon) => (
                sermon: sermon,
                score: cachedSermonRecommendationScore(
                  sermon,
                  bookId: bookId,
                  chapterPrefix: prefix,
                  verseId: verseId,
                ),
              ),
            )
            .where((entry) => entry.score > 0)
            .toList(growable: false)
          ..sort((a, b) {
            final scoreCompare = b.score.compareTo(a.score);
            if (scoreCompare != 0) {
              return scoreCompare;
            }
            return b.sermon.date.compareTo(a.sermon.date);
          });
    return scored.take(limit).map((entry) => entry.sermon).toList();
  }

  Future<void> cacheSermons(
    List<SermonDto> sermons, {
    DateTime? reconcileFrom,
    DateTime? reconcileTo,
  }) {
    return SermonCacheWriter(
      database: database,
    ).save(sermons, reconcileFrom: reconcileFrom, reconcileTo: reconcileTo);
  }

  Future<List<SermonDto>> _loadSermons(List<LocalSermon> sermons) async {
    if (sermons.isEmpty) {
      return const [];
    }
    final sermonIds = sermons
        .map((sermon) => sermon.id)
        .toList(growable: false);
    final outlines =
        await (database.select(database.localSermonOutlines)
              ..where((outline) => outline.sermonId.isIn(sermonIds))
              ..orderBy([(outline) => OrderingTerm.asc(outline.sortOrder)]))
            .get();
    final references = await (database.select(
      database.localSermonReferences,
    )..where((reference) => reference.sermonId.isIn(sermonIds))).get();
    final topics =
        await (database.select(database.localSermonTopics)
              ..where((topic) => topic.sermonId.isIn(sermonIds))
              ..orderBy([(topic) => OrderingTerm.asc(topic.sortOrder)]))
            .get();
    return mapCachedSermons(sermons, outlines, topics, references);
  }

  Future<SermonDto> _loadSermon(LocalSermon sermon) async {
    return (await _loadSermons([sermon])).single;
  }
}
