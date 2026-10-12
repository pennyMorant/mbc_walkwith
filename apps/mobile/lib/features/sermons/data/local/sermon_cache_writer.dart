import 'package:drift/drift.dart';

import '../../../../core/database/app_database.dart';
import '../dto/sermon_dto.dart';

class SermonCacheWriter {
  const SermonCacheWriter({required this.database});

  final AppDatabase database;

  Future<void> save(
    List<SermonDto> sermons, {
    DateTime? reconcileFrom,
    DateTime? reconcileTo,
  }) async {
    if ((reconcileFrom == null) != (reconcileTo == null)) {
      throw ArgumentError('Sermon cache reconciliation requires both bounds.');
    }
    final now = DateTime.now().toUtc();

    await database.transaction(() async {
      if (reconcileFrom != null && reconcileTo != null) {
        await _deleteRange(reconcileFrom, reconcileTo);
      }
      for (final sermon in sermons) {
        await _upsertSermon(sermon, now);
      }
    });
  }

  Future<void> _deleteRange(DateTime from, DateTime to) async {
    final rows =
        await (database.select(database.localSermons)..where(
              (sermon) =>
                  sermon.sermonDate.isBiggerOrEqualValue(from.toUtc()) &
                  sermon.sermonDate.isSmallerThanValue(to.toUtc()),
            ))
            .get();
    await _deleteSermonChildren(rows.map((row) => row.id).toList());
    if (rows.isEmpty) {
      return;
    }
    final ids = rows.map((row) => row.id).toList(growable: false);
    await (database.delete(
      database.localSermons,
    )..where((sermon) => sermon.id.isIn(ids))).go();
  }

  Future<void> _upsertSermon(SermonDto sermon, DateTime now) async {
    await _deleteSermonChildren([sermon.id]);
    await database
        .into(database.localSermons)
        .insertOnConflictUpdate(
          LocalSermonsCompanion.insert(
            id: sermon.id,
            title: sermon.title,
            speaker: sermon.speaker,
            sermonDate: _sermonDateFromString(sermon.date),
            series: Value(sermon.series),
            primaryReference: Value(sermon.primaryReference),
            durationSeconds: sermon.durationSeconds,
            summary: Value(sermon.summary),
            transcriptText: Value(sermon.transcript?.text),
            transcriptSource: Value(sermon.transcript?.source),
            transcriptUpdatedAt: Value(sermon.transcript?.updatedAt),
            audioUrl: Value(sermon.audioUrl),
            audioUrlExpiresAt: const Value(null),
            thumbnailUrl: Value(sermon.thumbnailUrl),
            updatedAt: now,
          ),
        );

    for (final (index, outline) in sermon.outline.indexed) {
      await database
          .into(database.localSermonOutlines)
          .insert(
            LocalSermonOutlinesCompanion.insert(
              id: '${sermon.id}:outline:$index',
              sermonId: sermon.id,
              title: outline.title,
              summary: outline.summary,
              startSeconds: outline.startSeconds,
              sortOrder: index,
            ),
          );
    }
    for (final (index, topic) in sermon.topics.indexed) {
      await database
          .into(database.localSermonTopics)
          .insert(
            LocalSermonTopicsCompanion.insert(
              sermonId: sermon.id,
              topic: topic,
              sortOrder: index,
            ),
          );
    }
    for (final (index, reference) in sermon.references.indexed) {
      await database
          .into(database.localSermonReferences)
          .insert(
            LocalSermonReferencesCompanion.insert(
              id: '${sermon.id}:reference:$index',
              sermonId: sermon.id,
              verseId: reference.verseId,
              referenceText: reference.reference,
              note: Value(reference.note),
              startSeconds: Value(reference.startSeconds),
            ),
          );
    }
  }

  Future<void> _deleteSermonChildren(List<String> sermonIds) async {
    if (sermonIds.isEmpty) {
      return;
    }
    await (database.delete(
      database.localSermonReferences,
    )..where((reference) => reference.sermonId.isIn(sermonIds))).go();
    await (database.delete(
      database.localSermonOutlines,
    )..where((outline) => outline.sermonId.isIn(sermonIds))).go();
    await (database.delete(
      database.localSermonTopics,
    )..where((topic) => topic.sermonId.isIn(sermonIds))).go();
  }
}

DateTime _sermonDateFromString(String value) {
  return DateTime.tryParse(value)?.toUtc() ??
      DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
}
