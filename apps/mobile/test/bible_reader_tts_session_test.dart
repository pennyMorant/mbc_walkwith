import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/media/app_media_session.dart';
import 'package:mbc_walkwith/features/study/data/bible_tts_controller.dart';
import 'package:mbc_walkwith/features/study/domain/bible_translation.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/presentation/bible_reader_tts_session.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/bible_tts_bar.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';

void main() {
  test(
    'session converts expected playback failures into visible state',
    () async {
      final engine = _SessionTtsEngine()..failSpeak = true;
      final session = _session(engine: engine);

      await session.play(
        verses: _verses,
        translation: BibleTranslation.web,
        bookId: 'john',
        bookName: 'John',
        chapter: 1,
        firstVisibleVerseIndex: 0,
      );

      expect(session.state.status, BibleTtsStatus.error);
      expect(session.state.errorCode, BibleTtsErrorCode.ttsStartFailed);
      session.dispose();
    },
  );

  test('interrupted playback retries from the current verse', () async {
    var firstVisibleIndex = 1;
    final engine = _SessionTtsEngine()..speakResults.addAll([0, 1]);
    final session = _session(engine: engine);

    await session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'john',
      bookName: 'John',
      chapter: 1,
      firstVisibleVerseIndex: firstVisibleIndex,
    );
    expect(session.state.status, BibleTtsStatus.interrupted);
    expect(session.state.currentVerseIndex, 1);

    firstVisibleIndex = 0;
    await session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'john',
      bookName: 'John',
      chapter: 1,
      firstVisibleVerseIndex: firstVisibleIndex,
    );

    expect(engine.spokenTexts, ['2. With God', '2. With God']);
    expect(session.state.status, BibleTtsStatus.stopped);
    session.dispose();
  });

  test('a different passage starts from its own visible verse', () async {
    final engine = _SessionTtsEngine()..speakResults.addAll([0, 1, 1]);
    final session = _session(engine: engine);

    await session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'john',
      bookName: 'John',
      chapter: 1,
      firstVisibleVerseIndex: 1,
    );
    await session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'rom',
      bookName: 'Romans',
      chapter: 8,
      firstVisibleVerseIndex: 0,
    );

    expect(engine.spokenTexts, [
      '2. With God',
      '1. In the beginning',
      '2. With God',
    ]);
    expect(session.isActivePassage(bookId: 'rom', chapter: 8), isTrue);
    session.dispose();
  });

  test(
    'native media session publishes verse metadata and pauses TTS',
    () async {
      final engine = _SessionTtsEngine()..blockSpeak = true;
      final mediaSession = AppMediaSession();
      final session = _session(engine: engine, mediaSession: mediaSession);

      final playback = session.play(
        verses: _verses,
        translation: BibleTranslation.web,
        bookId: 'john',
        bookName: 'John',
        chapter: 1,
        firstVisibleVerseIndex: 0,
      );
      await engine.waitForSpeakStart();

      expect(mediaSession.activeOwner, AppMediaOwner.bibleTts);
      expect(mediaSession.mediaItem.value?.title, 'John 1:1');
      expect(mediaSession.playbackState.value.playing, isTrue);

      await mediaSession.pause();
      expect(engine.pauseCount, 1);
      expect(session.state.status, BibleTtsStatus.paused);
      expect(mediaSession.playbackState.value.playing, isFalse);

      engine.completeSpeak(0);
      await playback;
      session.dispose();
    },
  );

  test('notification stop can be followed by a new reader playback', () async {
    final firstEngine = _SessionTtsEngine()..blockSpeak = true;
    final secondEngine = _SessionTtsEngine();
    final engines = [firstEngine, secondEngine];
    var engineIndex = 0;
    final mediaSession = AppMediaSession();
    final session = BibleReaderTtsSession(
      saveRate: (_) async {},
      recordVerseProgress: ({
        required bookId,
        required chapter,
        required verse,
      }) async {},
      engineFactory: () => engines[engineIndex++],
      mediaSession: mediaSession,
    );

    final firstPlayback = session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'john',
      bookName: 'John',
      chapter: 1,
      firstVisibleVerseIndex: 0,
    );
    await firstEngine.waitForSpeakStart();
    await mediaSession.stop();
    await firstPlayback;

    expect(session.state.status, BibleTtsStatus.stopped);
    expect(mediaSession.activeOwner, isNull);

    await session.play(
      verses: _verses,
      translation: BibleTranslation.web,
      bookId: 'john',
      bookName: 'John',
      chapter: 1,
      firstVisibleVerseIndex: 0,
    );

    expect(engineIndex, 2);
    expect(secondEngine.spokenTexts, ['1. In the beginning', '2. With God']);
    expect(session.state.status, BibleTtsStatus.stopped);
    session.dispose();
  });

  testWidgets('TTS bar displays a localized recoverable error', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: BibleTtsBar(
            status: BibleTtsStatus.error,
            errorCode: BibleTtsErrorCode.ttsLanguageUnavailable,
            rate: bibleTtsDefaultRate,
            currentVerseNumber: 2,
            onPlay: () {},
            onPause: () {},
            onStop: () {},
            onPrevious: () {},
            onNext: () {},
            onRateChanged: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('The system voice for this Bible language is not installed.'),
      findsOneWidget,
    );
  });

  testWidgets('TTS bar blocks duplicate playback intents while loading', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: BibleTtsBar(
            status: BibleTtsStatus.loading,
            errorCode: null,
            rate: bibleTtsDefaultRate,
            currentVerseNumber: 2,
            onPlay: () {},
            onPause: () {},
            onStop: () {},
            onPrevious: () {},
            onNext: () {},
            onRateChanged: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final buttons = tester.widgetList<IconButton>(find.byType(IconButton));
    expect(buttons.elementAt(0).onPressed, isNull);
    expect(buttons.elementAt(1).onPressed, isNull);
    expect(buttons.elementAt(2).onPressed, isNull);
    expect(buttons.elementAt(3).onPressed, isNotNull);
    expect(tester.widget<Slider>(find.byType(Slider)).onChanged, isNull);
  });
}

BibleReaderTtsSession _session({
  required _SessionTtsEngine engine,
  AppMediaSession? mediaSession,
}) {
  return BibleReaderTtsSession(
    saveRate: (_) async {},
    recordVerseProgress: ({
      required bookId,
      required chapter,
      required verse,
    }) async {},
    engineFactory: () => engine,
    mediaSession: mediaSession,
  );
}

const _verses = [
  BibleVerse(id: 'john.1.1', number: 1, text: 'In the beginning'),
  BibleVerse(id: 'john.1.2', number: 2, text: 'With God'),
];

class _SessionTtsEngine implements TtsPlaybackEngine {
  final spokenTexts = <String>[];
  final speakResults = <Object?>[];
  bool failSpeak = false;
  bool blockSpeak = false;
  int pauseCount = 0;
  Completer<void>? _speakStarted;
  Completer<Object?>? _speakCompletion;

  @override
  Future<void> prepareForBackgroundPlayback() async {}

  @override
  Future<void> awaitSpeakCompletion(bool enabled) async {}

  @override
  Future<void> pause() async {
    pauseCount += 1;
  }

  @override
  Future<Object?> setLanguage(String languageCode) async => 1;

  @override
  Future<void> setPitch(double pitch) async {}

  @override
  Future<void> setSpeechRate(double rate) async {}

  @override
  Future<void> setVolume(double volume) async {}

  @override
  Future<Object?> speak(String text) async {
    spokenTexts.add(text);
    _speakStarted?.complete();
    if (failSpeak) {
      throw StateError('TTS failed');
    }
    if (blockSpeak) {
      return (_speakCompletion ??= Completer<Object?>()).future;
    }
    return speakResults.isEmpty ? 1 : speakResults.removeAt(0);
  }

  @override
  Future<void> stop() async {
    final completion = _speakCompletion;
    if (completion != null && !completion.isCompleted) {
      completion.complete(0);
      _speakCompletion = null;
    }
  }

  Future<void> waitForSpeakStart() async {
    if (spokenTexts.isNotEmpty) {
      return;
    }
    _speakStarted ??= Completer<void>();
    await _speakStarted!.future;
  }

  void completeSpeak(Object? result) {
    _speakCompletion?.complete(result);
    _speakCompletion = null;
  }
}
