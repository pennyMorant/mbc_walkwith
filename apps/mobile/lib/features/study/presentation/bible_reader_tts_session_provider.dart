import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/media/app_media_session_provider.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import '../data/study_repository.dart';
import 'bible_reader_tts_session.dart';
import 'widgets/bible_tts_bar.dart';

const _ttsRatePreferenceKey = 'reader_tts_rate';

final bibleReaderTtsSessionProvider = Provider<BibleReaderTtsSession>((ref) {
  final preferences = ref.read(sharedPreferencesProvider);
  final session = BibleReaderTtsSession(
    initialRate: bibleTtsDefaultRate,
    mediaSession: ref.read(appMediaSessionProvider),
    saveRate: (rate) => preferences.setDouble(_ttsRatePreferenceKey, rate),
    recordVerseProgress: ({required bookId, required chapter, required verse}) {
      return ref
          .read(studyRepositoryProvider)
          .saveReadingProgress(
            bookId: bookId,
            chapter: chapter,
            verseId: verse.id,
          );
    },
  );

  unawaited(
    session.restoreSavedRate(preferences.getDouble(_ttsRatePreferenceKey)),
  );
  ref.onDispose(session.dispose);
  return session;
});
