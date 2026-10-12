import 'bible_tts_engine.dart';
import 'bible_tts_state.dart';

export 'bible_tts_engine.dart';
export 'bible_tts_state.dart';

class BibleTtsController {
  BibleTtsController({
    required double initialRate,
    required BibleTtsStateListener onStateChanged,
    TtsPlaybackEngineFactory? engineFactory,
  }) : _onStateChanged = onStateChanged,
       _engineFactory = engineFactory ?? FlutterTtsPlaybackEngine.new,
       _state = BibleTtsState.initial(rate: initialRate);

  final BibleTtsStateListener _onStateChanged;
  final TtsPlaybackEngineFactory _engineFactory;
  TtsPlaybackEngine? _engine;
  BibleTtsState _state;
  int _runId = 0;
  bool _disposed = false;

  BibleTtsState get state => _state;

  Future<void> setRate(double rate) async {
    final engine = _engine;
    if (engine == null) {
      _emit(_state.copyWith(rate: rate));
      return;
    }
    try {
      await engine.setSpeechRate(rate);
      _emit(_state.copyWith(rate: rate, clearError: true));
    } catch (error) {
      _emit(
        _state.copyWith(
          status: BibleTtsStatus.error,
          errorCode: BibleTtsErrorCode.ttsEngineUnavailable,
        ),
      );
      throw BibleTtsException(
        BibleTtsErrorCode.ttsEngineUnavailable,
        cause: error,
      );
    }
  }

  Future<void> speak({
    required List<BibleTtsVerse> verses,
    required String translationId,
    required int startIndex,
    BibleTtsVerseStarted? onVerseStarted,
  }) async {
    if (_disposed) {
      final error = const BibleTtsException(BibleTtsErrorCode.ttsDisposed);
      _state = _state.copyWith(
        status: BibleTtsStatus.error,
        errorCode: error.code,
      );
      throw error;
    }

    final textError = _validateText(verses);
    if (textError != null) {
      _emit(
        _state.copyWith(
          status: BibleTtsStatus.error,
          errorCode: textError.code,
        ),
      );
      throw textError;
    }

    final safeStartIndex = startIndex.clamp(0, verses.length - 1).toInt();
    final runId = ++_runId;
    try {
      _emit(
        _state.copyWith(
          status: BibleTtsStatus.loading,
          currentVerseIndex: safeStartIndex,
          clearCurrentVerse: true,
          clearError: true,
        ),
      );

      final engine = await _ensureEngine(translationId);
      if (runId != _runId) {
        return;
      }
      await engine.stop();
      if (runId != _runId) {
        return;
      }

      _emit(
        _state.copyWith(
          status: BibleTtsStatus.speaking,
          currentVerseIndex: safeStartIndex,
          clearError: true,
        ),
      );

      for (var index = safeStartIndex; index < verses.length; index++) {
        if (runId != _runId) {
          return;
        }

        final verse = verses[index];
        _emit(
          _state.copyWith(
            status: BibleTtsStatus.speaking,
            currentVerseId: verse.id,
            currentVerseIndex: index,
            clearError: true,
          ),
        );
        onVerseStarted?.call(verse, index);

        final result = await engine.speak(_textForVerse(verse));
        if (runId != _runId) {
          return;
        }
        if (result != 1 && result != true) {
          _emit(
            _state.copyWith(
              status: BibleTtsStatus.interrupted,
              errorCode: BibleTtsErrorCode.ttsInterrupted,
            ),
          );
          return;
        }
      }

      if (runId != _runId) {
        return;
      }
      _emit(
        _state.copyWith(
          status: BibleTtsStatus.stopped,
          clearCurrentVerse: true,
          clearError: true,
        ),
      );
    } on BibleTtsException catch (error) {
      if (runId == _runId) {
        _emit(
          _state.copyWith(status: BibleTtsStatus.error, errorCode: error.code),
        );
      }
      rethrow;
    } catch (error) {
      if (runId == _runId) {
        _emit(
          _state.copyWith(
            status: BibleTtsStatus.error,
            errorCode: BibleTtsErrorCode.ttsStartFailed,
          ),
        );
      }
      throw BibleTtsException(BibleTtsErrorCode.ttsStartFailed, cause: error);
    }
  }

  Future<void> pause() async {
    if (_state.status != BibleTtsStatus.speaking) {
      return;
    }
    final runId = ++_runId;
    try {
      await _engine?.pause();
      if (runId != _runId) {
        return;
      }
      _emit(_state.copyWith(status: BibleTtsStatus.paused, clearError: true));
    } catch (error) {
      if (runId == _runId) {
        _emit(
          _state.copyWith(
            status: BibleTtsStatus.interrupted,
            errorCode: BibleTtsErrorCode.ttsInterrupted,
          ),
        );
      }
      throw BibleTtsException(BibleTtsErrorCode.ttsInterrupted, cause: error);
    }
  }

  Future<void> stop() async {
    final runId = ++_runId;
    final engine = _engine;
    _engine = null;
    try {
      await engine?.stop();
      if (runId != _runId) {
        return;
      }
      _emit(
        _state.copyWith(
          status: BibleTtsStatus.stopped,
          clearCurrentVerse: true,
          clearError: true,
        ),
      );
    } catch (error) {
      if (runId == _runId) {
        _emit(
          _state.copyWith(
            status: BibleTtsStatus.error,
            errorCode: BibleTtsErrorCode.ttsEngineUnavailable,
          ),
        );
      }
      throw BibleTtsException(
        BibleTtsErrorCode.ttsEngineUnavailable,
        cause: error,
      );
    }
  }

  Future<void> dispose() async {
    _runId++;
    _disposed = true;
    final engine = _engine;
    _engine = null;
    if (engine != null) {
      try {
        await engine.stop();
      } catch (_) {
        // Disposal is best-effort after the controller stops publishing state.
      }
    }
    _state = _state.copyWith(
      status: BibleTtsStatus.stopped,
      clearCurrentVerse: true,
      clearError: true,
    );
  }

  Future<TtsPlaybackEngine> _ensureEngine(String translationId) async {
    final existing = _engine;
    if (existing != null) {
      await _configure(existing, translationId);
      return existing;
    }

    late final TtsPlaybackEngine engine;
    try {
      engine = _engineFactory();
    } catch (error) {
      throw BibleTtsException(
        BibleTtsErrorCode.ttsEngineUnavailable,
        cause: error,
      );
    }

    _engine = engine;
    try {
      await engine.prepareForBackgroundPlayback();
      await engine.awaitSpeakCompletion(true);
      await _configure(engine, translationId);
      return engine;
    } catch (_) {
      _engine = null;
      rethrow;
    }
  }

  Future<void> _configure(
    TtsPlaybackEngine engine,
    String translationId,
  ) async {
    try {
      final result = await engine.setLanguage(_languageCode(translationId));
      if (result != 1 && result != true) {
        throw StateError('TTS language unavailable');
      }
    } catch (error) {
      throw BibleTtsException(
        BibleTtsErrorCode.ttsLanguageUnavailable,
        cause: error,
      );
    }
    try {
      await engine.setSpeechRate(_state.rate);
      await engine.setVolume(1);
      await engine.setPitch(1);
    } catch (error) {
      throw BibleTtsException(
        BibleTtsErrorCode.ttsEngineUnavailable,
        cause: error,
      );
    }
  }

  void _emit(BibleTtsState state) {
    _state = state;
    if (_disposed) {
      return;
    }
    _onStateChanged(state);
  }

  String _languageCode(String translationId) {
    return switch (translationId) {
      'cuvt' => 'zh-TW',
      'cuvs' => 'zh-CN',
      _ => 'en-US',
    };
  }

  String _textForVerse(BibleTtsVerse verse) {
    return '${verse.number}. ${verse.text}';
  }

  BibleTtsException? _validateText(List<BibleTtsVerse> verses) {
    if (verses.isEmpty) {
      return const BibleTtsException(BibleTtsErrorCode.bibleTextMissing);
    }
    for (final verse in verses) {
      if (verse.text.trim().isEmpty) {
        return const BibleTtsException(BibleTtsErrorCode.bibleTextMissing);
      }
    }
    return null;
  }
}
