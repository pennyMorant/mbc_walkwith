import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/media/app_media_session.dart';
import '../data/bible_tts_controller.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';
import 'bible_tts_media_bridge.dart';
import 'widgets/bible_tts_bar.dart';

class BibleReaderTtsSession extends ChangeNotifier {
  BibleReaderTtsSession({
    required Future<void> Function(double rate) saveRate,
    required Future<void> Function({
      required String bookId,
      required int chapter,
      required BibleTtsVerse verse,
    })
    recordVerseProgress,
    double initialRate = bibleTtsDefaultRate,
    TtsPlaybackEngineFactory? engineFactory,
    AppMediaSession? mediaSession,
  }) : _saveRate = saveRate,
       _recordVerseProgress = recordVerseProgress,
       state = BibleTtsState.initial(rate: initialRate) {
    _mediaBridge = BibleTtsMediaBridge(
      mediaSession: mediaSession,
      onPlay: _playFromMediaControls,
      onPause: pause,
      onStop: stop,
      onMove: _moveFromMediaControls,
    );
    _controller = BibleTtsController(
      initialRate: initialRate,
      onStateChanged: _setState,
      engineFactory: engineFactory,
    );
  }

  final Future<void> Function(double rate) _saveRate;
  final Future<void> Function({
    required String bookId,
    required int chapter,
    required BibleTtsVerse verse,
  })
  _recordVerseProgress;
  late final BibleTtsController _controller;
  late final BibleTtsMediaBridge _mediaBridge;
  BibleTtsState state;
  bool _disposed = false;
  String? _activeBookId;
  int? _activeChapter;
  String? _activeBookName;
  BibleTranslation? _activeTranslation;
  List<BibleVerse> _activeVerses = const [];

  bool get hasActivePassage => _activeBookId != null && _activeChapter != null;

  bool isActivePassage({required String bookId, required int chapter}) {
    return _activeBookId == bookId && _activeChapter == chapter;
  }

  Future<void> restoreSavedRate(double? savedRate) async {
    if (savedRate == null) {
      return;
    }
    final nextRate = _clampRate(savedRate);
    await _runTtsAction(() => _controller.setRate(nextRate));
  }

  Future<void> updateRate(double rate) async {
    final nextRate = _clampRate(rate);
    try {
      await _controller.setRate(nextRate);
      await _saveRate(nextRate);
    } on BibleTtsException {
      // The controller already published the recoverable error state.
    }
  }

  int? currentVerseNumber({
    required List<BibleVerse> verses,
    required String bookId,
    required int chapter,
  }) {
    if (!isActivePassage(bookId: bookId, chapter: chapter)) {
      return null;
    }
    final verseId = state.currentVerseId;
    if (verseId == null) {
      return null;
    }
    for (final verse in verses) {
      if (verse.id == verseId) {
        return verse.number;
      }
    }
    return null;
  }

  Future<void> play({
    required List<BibleVerse> verses,
    required BibleTranslation translation,
    required String bookId,
    required String bookName,
    required int chapter,
    int? firstVisibleVerseIndex,
  }) async {
    if (verses.isEmpty) {
      return;
    }

    final samePassage = isActivePassage(bookId: bookId, chapter: chapter);
    final startIndex = !samePassage
        ? (firstVisibleVerseIndex ?? 0).clamp(0, verses.length - 1)
        : switch (state.status) {
            BibleTtsStatus.idle || BibleTtsStatus.stopped =>
              firstVisibleVerseIndex ??
                  (state.currentVerseIndex ?? 0).clamp(0, verses.length - 1),
            BibleTtsStatus.error || BibleTtsStatus.interrupted =>
              (state.currentVerseIndex ?? firstVisibleVerseIndex ?? 0).clamp(
                0,
                verses.length - 1,
              ),
            BibleTtsStatus.loading ||
            BibleTtsStatus.paused => state.currentVerseIndex ?? 0,
            BibleTtsStatus.speaking => state.currentVerseIndex ?? 0,
          };
    await _runTtsAction(
      () => _speakFromIndex(
        verses: verses,
        translation: translation,
        bookId: bookId,
        bookName: bookName,
        chapter: chapter,
        startIndex: startIndex,
      ),
    );
  }

  Future<void> pause() async {
    if (state.status != BibleTtsStatus.speaking) {
      return;
    }
    await _runTtsAction(_controller.pause);
  }

  Future<void> stop() async {
    await _runTtsAction(_controller.stop);
  }

  Future<void> moveBy({
    required int delta,
    required List<BibleVerse> verses,
    required BibleTranslation translation,
    required String bookId,
    required String bookName,
    required int chapter,
  }) async {
    if (verses.isEmpty) {
      return;
    }
    final currentIndex = state.currentVerseIndex ?? 0;
    final nextIndex = (currentIndex + delta).clamp(0, verses.length - 1);
    await _runTtsAction(
      () => _speakFromIndex(
        verses: verses,
        translation: translation,
        bookId: bookId,
        bookName: bookName,
        chapter: chapter,
        startIndex: nextIndex,
      ),
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _mediaBridge.release();
    unawaited(_controller.dispose());
    super.dispose();
  }

  Future<void> _speakFromIndex({
    required List<BibleVerse> verses,
    required BibleTranslation translation,
    required String bookId,
    required String bookName,
    required int chapter,
    required int startIndex,
  }) async {
    _activeBookId = bookId;
    _activeChapter = chapter;
    _activeBookName = bookName;
    _activeTranslation = translation;
    _activeVerses = verses;
    final safeIndex = startIndex.clamp(0, verses.length - 1).toInt();
    final activated = await _mediaBridge.activate(
      translation: translation,
      bookId: bookId,
      bookName: bookName,
      chapter: chapter,
      verses: verses,
      verseIndex: safeIndex,
    );
    if (!activated) {
      return;
    }
    await _controller.speak(
      verses: [
        for (final verse in verses)
          BibleTtsVerse(id: verse.id, number: verse.number, text: verse.text),
      ],
      translationId: translation.id,
      startIndex: safeIndex,
      onVerseStarted: (verse, index) {
        unawaited(
          _recordVerseProgress(bookId: bookId, chapter: chapter, verse: verse),
        );
      },
    );
  }

  double _clampRate(double rate) {
    return rate.clamp(bibleTtsMinRate, bibleTtsMaxRate).toDouble();
  }

  Future<void> _runTtsAction(Future<void> Function() action) async {
    try {
      await action();
    } on BibleTtsException {
      // The controller already published the recoverable error state.
    }
  }

  void _setState(BibleTtsState nextState) {
    state = nextState;
    _mediaBridge.sync(nextState);
    if (!_disposed) {
      notifyListeners();
    }
  }

  Future<void> _playFromMediaControls() async {
    final translation = _activeTranslation;
    final bookId = _activeBookId;
    final bookName = _activeBookName;
    final chapter = _activeChapter;
    if (translation == null ||
        bookId == null ||
        bookName == null ||
        chapter == null ||
        _activeVerses.isEmpty) {
      return;
    }
    final index = (state.currentVerseIndex ?? 0).clamp(
      0,
      _activeVerses.length - 1,
    );
    await _runTtsAction(
      () => _speakFromIndex(
        verses: _activeVerses,
        translation: translation,
        bookId: bookId,
        bookName: bookName,
        chapter: chapter,
        startIndex: index,
      ),
    );
  }

  Future<void> _moveFromMediaControls(int delta) async {
    final translation = _activeTranslation;
    final bookId = _activeBookId;
    final bookName = _activeBookName;
    final chapter = _activeChapter;
    if (translation == null ||
        bookId == null ||
        bookName == null ||
        chapter == null ||
        _activeVerses.isEmpty) {
      return;
    }
    await moveBy(
      delta: delta,
      verses: _activeVerses,
      translation: translation,
      bookId: bookId,
      bookName: bookName,
      chapter: chapter,
    );
  }
}
