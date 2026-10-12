import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/study_repository.dart';
import '../domain/bible_book.dart';

class BibleChapterPrefetcher {
  final _prefetchedChapterKeys = <String>{};

  void prefetchAdjacent({
    required WidgetRef ref,
    required BibleBook book,
    required int chapter,
    required String translationId,
  }) {
    final chapters = [
      if (chapter > 1) chapter - 1,
      if (chapter < book.chapterCount) chapter + 1,
    ];

    for (final adjacentChapter in chapters) {
      final key = '$translationId:${book.id}:$adjacentChapter';
      if (!_prefetchedChapterKeys.add(key)) {
        continue;
      }

      unawaited(
        ref
            .read(
              bibleChapterVersesProvider(
                BibleChapterRequest(
                  bookId: book.id,
                  chapter: adjacentChapter,
                  translationId: translationId,
                ),
              ).future,
            )
            .then<void>((_) {})
            .catchError((Object error, StackTrace stackTrace) {}),
      );
    }
  }
}
