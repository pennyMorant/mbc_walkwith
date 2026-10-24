import 'bible_tts_engine.dart';
import 'bible_tts_state.dart';

abstract final class BibleTtsEngineSetup {
  static Future<void> configure({
    required TtsPlaybackEngine engine,
    required String translationId,
    required double rate,
  }) async {
    try {
      final result = await engine.setLanguage(
        languageCodeForTranslation(translationId),
      );
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
      await engine.setSpeechRate(rate);
      await engine.setVolume(1);
      await engine.setPitch(1);
    } catch (error) {
      throw BibleTtsException(
        BibleTtsErrorCode.ttsEngineUnavailable,
        cause: error,
      );
    }
  }

  static String languageCodeForTranslation(String translationId) {
    return switch (translationId) {
      'cuvt' => 'zh-TW',
      'cuvs' => 'zh-CN',
      _ => 'en-US',
    };
  }

  static String spokenTextForVerse(BibleTtsVerse verse) {
    return '${verse.number}. ${verse.text}';
  }

  static BibleTtsException? validateVerses(List<BibleTtsVerse> verses) {
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
