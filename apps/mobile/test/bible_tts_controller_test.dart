import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/data/bible_tts_controller.dart';

void main() {
  test('speaks Bible verses through the playback engine in order', () async {
    final engine = _FakeTtsPlaybackEngine();
    final states = <BibleTtsState>[];
    final started = <String>[];
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: states.add,
    );

    await controller.speak(
      translationId: 'cuvs',
      startIndex: 0,
      verses: const [
        BibleTtsVerse(id: 'john.1.1', number: 1, text: '太初有道'),
        BibleTtsVerse(id: 'john.1.2', number: 2, text: '这道太初与神同在'),
      ],
      onVerseStarted: (verse, index) => started.add('$index:${verse.id}'),
    );

    expect(engine.awaitCompletionEnabled, isTrue);
    expect(engine.backgroundPlaybackPrepared, isTrue);
    expect(engine.languageCode, 'zh-CN');
    expect(engine.rate, 0.48);
    expect(engine.spokenTexts, ['1. 太初有道', '2. 这道太初与神同在']);
    expect(started, ['0:john.1.1', '1:john.1.2']);
    expect(states.first.status, BibleTtsStatus.loading);
    expect(states.last.status, BibleTtsStatus.stopped);
    expect(states.last.currentVerseId, isNull);
    expect(states.last.errorCode, isNull);
  });

  test('pause keeps the current verse state', () async {
    final engine = _FakeTtsPlaybackEngine();
    final states = <BibleTtsState>[];
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: states.add,
    );
    engine.blockSpeak = true;

    final speaking = controller.speak(
      translationId: 'web',
      startIndex: 0,
      verses: const [
        BibleTtsVerse(id: 'rom.8.28', number: 28, text: 'All things work'),
      ],
    );
    await engine.waitForSpeakStart();

    await controller.pause();
    engine.completeSpeak(0);
    await speaking;

    expect(engine.pauseCount, 1);
    expect(controller.state.status, BibleTtsStatus.paused);
    expect(controller.state.currentVerseId, 'rom.8.28');
  });

  test('marks playback as structured error when the engine fails', () async {
    final engine = _FakeTtsPlaybackEngine()..failSpeak = true;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    await expectLater(
      controller.speak(
        translationId: 'web',
        startIndex: 0,
        verses: const [
          BibleTtsVerse(
            id: 'ps.23.1',
            number: 1,
            text: 'The Lord is my shepherd',
          ),
        ],
      ),
      _throwsBibleTtsCode(BibleTtsErrorCode.ttsStartFailed),
    );

    expect(controller.state.status, BibleTtsStatus.error);
    expect(controller.state.currentVerseId, 'ps.23.1');
    expect(controller.state.errorCode, BibleTtsErrorCode.ttsStartFailed);
  });

  test('rejects missing Bible text before creating playback engine', () async {
    var engineCreated = false;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () {
        engineCreated = true;
        return _FakeTtsPlaybackEngine();
      },
      onStateChanged: (_) {},
    );

    await expectLater(
      controller.speak(
        translationId: 'web',
        startIndex: 0,
        verses: const [BibleTtsVerse(id: 'missing.1.1', number: 1, text: ' ')],
      ),
      _throwsBibleTtsCode(BibleTtsErrorCode.bibleTextMissing),
    );

    expect(engineCreated, isFalse);
    expect(controller.state.status, BibleTtsStatus.error);
    expect(controller.state.errorCode, BibleTtsErrorCode.bibleTextMissing);
  });

  test('reports language setup failures with a stable error code', () async {
    final engine = _FakeTtsPlaybackEngine()..failLanguage = true;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    await expectLater(
      controller.speak(
        translationId: 'cuvt',
        startIndex: 0,
        verses: const [BibleTtsVerse(id: 'john.1.1', number: 1, text: '太初有道')],
      ),
      _throwsBibleTtsCode(BibleTtsErrorCode.ttsLanguageUnavailable),
    );

    expect(engine.languageCode, isNull);
    expect(controller.state.status, BibleTtsStatus.error);
    expect(
      controller.state.errorCode,
      BibleTtsErrorCode.ttsLanguageUnavailable,
    );
  });

  test('treats a non-success language result as unavailable', () async {
    final engine = _FakeTtsPlaybackEngine()..languageResult = 0;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    await expectLater(
      controller.speak(
        translationId: 'cuvs',
        startIndex: 0,
        verses: const [BibleTtsVerse(id: 'john.1.1', number: 1, text: '太初有道')],
      ),
      _throwsBibleTtsCode(BibleTtsErrorCode.ttsLanguageUnavailable),
    );

    expect(controller.state.status, BibleTtsStatus.error);
    expect(
      controller.state.errorCode,
      BibleTtsErrorCode.ttsLanguageUnavailable,
    );
  });

  test('marks non-success engine completion as interrupted', () async {
    final engine = _FakeTtsPlaybackEngine()..interruptSpeak = true;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    await controller.speak(
      translationId: 'web',
      startIndex: 0,
      verses: const [BibleTtsVerse(id: 'ps.23.1', number: 1, text: 'The Lord')],
    );

    expect(controller.state.status, BibleTtsStatus.interrupted);
    expect(controller.state.currentVerseId, 'ps.23.1');
    expect(controller.state.errorCode, BibleTtsErrorCode.ttsInterrupted);
  });

  test('stops active playback on dispose and rejects later speech', () async {
    final engine = _FakeTtsPlaybackEngine()..blockSpeak = true;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    final speaking = controller.speak(
      translationId: 'web',
      startIndex: 0,
      verses: const [
        BibleTtsVerse(id: 'rom.8.28', number: 28, text: 'All things work'),
      ],
    );
    await engine.waitForSpeakStart();

    await controller.dispose();
    engine.completeSpeak(1);
    await speaking;

    expect(engine.stopCount, 2);
    expect(controller.state.status, BibleTtsStatus.stopped);
    expect(controller.state.currentVerseId, isNull);

    await expectLater(
      controller.speak(
        translationId: 'web',
        startIndex: 0,
        verses: const [
          BibleTtsVerse(id: 'rom.8.29', number: 29, text: 'Called'),
        ],
      ),
      _throwsBibleTtsCode(BibleTtsErrorCode.ttsDisposed),
    );
    expect(controller.state.errorCode, BibleTtsErrorCode.ttsDisposed);
  });

  test('explicit stop rebuilds the platform engine before replay', () async {
    final engines = [_FakeTtsPlaybackEngine(), _FakeTtsPlaybackEngine()];
    var engineIndex = 0;
    final controller = BibleTtsController(
      initialRate: 0.5,
      onStateChanged: (_) {},
      engineFactory: () => engines[engineIndex++],
    );

    await controller.speak(
      verses: const [
        BibleTtsVerse(id: 'john.1.1', number: 1, text: 'In the beginning'),
      ],
      translationId: 'web',
      startIndex: 0,
    );
    await controller.stop();
    await controller.speak(
      verses: const [
        BibleTtsVerse(id: 'john.1.1', number: 1, text: 'In the beginning'),
      ],
      translationId: 'web',
      startIndex: 0,
    );

    expect(engineIndex, 2);
    expect(engines.first.stopCount, 2);
    expect(engines.last.spokenTexts, ['1. In the beginning']);
    expect(controller.state.status, BibleTtsStatus.stopped);
  });

  test('starting a new read cancels the previous run', () async {
    final engine = _FakeTtsPlaybackEngine()..blockSpeak = true;
    final controller = BibleTtsController(
      initialRate: 0.48,
      engineFactory: () => engine,
      onStateChanged: (_) {},
    );

    final first = controller.speak(
      translationId: 'web',
      startIndex: 0,
      verses: const [
        BibleTtsVerse(id: 'john.1.1', number: 1, text: 'In the beginning'),
      ],
    );
    await engine.waitForSpeakStart();

    final second = controller.speak(
      translationId: 'web',
      startIndex: 0,
      verses: const [
        BibleTtsVerse(id: 'john.1.2', number: 2, text: 'With God'),
      ],
    );
    await engine.waitForSpeakStart(count: 2);

    engine.completeSpeak(0, index: 0);
    engine.completeSpeak(1, index: 1);
    await Future.wait([first, second]);

    expect(engine.stopCount, 2);
    expect(engine.spokenTexts, ['1. In the beginning', '2. With God']);
    expect(controller.state.status, BibleTtsStatus.stopped);
    expect(controller.state.currentVerseId, isNull);
  });

  test(
    'stop during engine setup prevents stale speech from starting',
    () async {
      final engine = _FakeTtsPlaybackEngine()..blockLanguage = true;
      final controller = BibleTtsController(
        initialRate: 0.48,
        engineFactory: () => engine,
        onStateChanged: (_) {},
      );

      final speaking = controller.speak(
        translationId: 'web',
        startIndex: 0,
        verses: const [
          BibleTtsVerse(id: 'john.1.1', number: 1, text: 'In the beginning'),
        ],
      );
      await engine.waitForLanguageStart();

      await controller.stop();
      engine.completeLanguage(1);
      await speaking;

      expect(engine.spokenTexts, isEmpty);
      expect(controller.state.status, BibleTtsStatus.stopped);
      expect(controller.state.currentVerseId, isNull);
    },
  );
}

Matcher _throwsBibleTtsCode(String code) {
  return throwsA(
    isA<BibleTtsException>().having((error) => error.code, 'code', code),
  );
}

class _FakeTtsPlaybackEngine implements TtsPlaybackEngine {
  bool awaitCompletionEnabled = false;
  bool backgroundPlaybackPrepared = false;
  String? languageCode;
  double? rate;
  final spokenTexts = <String>[];
  bool blockSpeak = false;
  bool failSpeak = false;
  bool failLanguage = false;
  bool blockLanguage = false;
  bool interruptSpeak = false;
  Object? languageResult = 1;
  int pauseCount = 0;
  int stopCount = 0;
  final List<Completer<Object?>> _speakCompleters = [];
  Completer<Object?>? _languageCompleter;

  @override
  Future<void> prepareForBackgroundPlayback() async {
    backgroundPlaybackPrepared = true;
  }

  @override
  Future<void> awaitSpeakCompletion(bool enabled) async {
    awaitCompletionEnabled = enabled;
  }

  @override
  Future<Object?> setLanguage(String languageCode) async {
    if (failLanguage) {
      throw StateError('Language unavailable');
    }
    this.languageCode = languageCode;
    if (blockLanguage) {
      final completer = Completer<Object?>();
      _languageCompleter = completer;
      return completer.future;
    }
    return languageResult;
  }

  @override
  Future<void> setSpeechRate(double rate) async {
    this.rate = rate;
  }

  @override
  Future<void> setVolume(double volume) async {}

  @override
  Future<void> setPitch(double pitch) async {}

  @override
  Future<Object?> speak(String text) async {
    spokenTexts.add(text);
    if (failSpeak) {
      throw StateError('TTS engine failed');
    }
    if (interruptSpeak) {
      return 0;
    }
    if (!blockSpeak) {
      return 1;
    }
    final completer = Completer<Object?>();
    _speakCompleters.add(completer);
    return completer.future;
  }

  Future<void> waitForSpeakStart({int count = 1}) async {
    while (_speakCompleters.length < count) {
      await Future<void>.delayed(Duration.zero);
    }
  }

  void completeSpeak(Object? result, {int? index}) {
    final completer = _speakCompleters[index ?? _speakCompleters.length - 1];
    if (!completer.isCompleted) {
      completer.complete(result);
    }
  }

  Future<void> waitForLanguageStart() async {
    while (_languageCompleter == null) {
      await Future<void>.delayed(Duration.zero);
    }
  }

  void completeLanguage(Object? result) {
    final completer = _languageCompleter;
    if (completer != null && !completer.isCompleted) {
      completer.complete(result);
    }
  }

  @override
  Future<void> pause() async {
    pauseCount += 1;
  }

  @override
  Future<void> stop() async {
    stopCount += 1;
  }
}
