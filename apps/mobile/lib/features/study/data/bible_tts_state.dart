enum BibleTtsStatus {
  idle,
  loading,
  speaking,
  paused,
  stopped,
  interrupted,
  error,
}

abstract final class BibleTtsErrorCode {
  static const bibleTextMissing = 'bible_text_missing';
  static const ttsEngineUnavailable = 'tts_engine_unavailable';
  static const ttsLanguageUnavailable = 'tts_language_unavailable';
  static const ttsInterrupted = 'tts_interrupted';
  static const ttsStartFailed = 'tts_start_failed';
  static const ttsDisposed = 'tts_disposed';
}

class BibleTtsException implements Exception {
  const BibleTtsException(this.code, {this.cause});

  final String code;
  final Object? cause;

  @override
  String toString() {
    final cause = this.cause;
    if (cause == null) {
      return 'BibleTtsException($code)';
    }
    return 'BibleTtsException($code, cause: $cause)';
  }
}

class BibleTtsVerse {
  const BibleTtsVerse({
    required this.id,
    required this.number,
    required this.text,
  });

  final String id;
  final int number;
  final String text;
}

class BibleTtsState {
  const BibleTtsState({
    required this.status,
    required this.rate,
    this.currentVerseId,
    this.currentVerseIndex,
    this.errorCode,
  });

  factory BibleTtsState.initial({required double rate}) {
    return BibleTtsState(status: BibleTtsStatus.idle, rate: rate);
  }

  final BibleTtsStatus status;
  final double rate;
  final String? currentVerseId;
  final int? currentVerseIndex;
  final String? errorCode;

  BibleTtsState copyWith({
    BibleTtsStatus? status,
    double? rate,
    String? currentVerseId,
    int? currentVerseIndex,
    String? errorCode,
    bool clearCurrentVerse = false,
    bool clearError = false,
  }) {
    return BibleTtsState(
      status: status ?? this.status,
      rate: rate ?? this.rate,
      currentVerseId: clearCurrentVerse
          ? null
          : currentVerseId ?? this.currentVerseId,
      currentVerseIndex: clearCurrentVerse
          ? null
          : currentVerseIndex ?? this.currentVerseIndex,
      errorCode: clearError ? null : errorCode ?? this.errorCode,
    );
  }
}

typedef BibleTtsStateListener = void Function(BibleTtsState state);
typedef BibleTtsVerseStarted = void Function(BibleTtsVerse verse, int index);
