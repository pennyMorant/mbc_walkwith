import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/storage/shared_preferences_provider.dart';

part 'reader_assist_settings_provider.g.dart';

class ReaderAssistSettings {
  const ReaderAssistSettings({
    required this.showChapterPeople,
    required this.showChapterPlaces,
    required this.showLexicon,
    required this.showAiStudyHints,
  });

  final bool showChapterPeople;
  final bool showChapterPlaces;
  final bool showLexicon;
  final bool showAiStudyHints;

  ReaderAssistSettings copyWith({
    bool? showChapterPeople,
    bool? showChapterPlaces,
    bool? showLexicon,
    bool? showAiStudyHints,
  }) {
    return ReaderAssistSettings(
      showChapterPeople: showChapterPeople ?? this.showChapterPeople,
      showChapterPlaces: showChapterPlaces ?? this.showChapterPlaces,
      showLexicon: showLexicon ?? this.showLexicon,
      showAiStudyHints: showAiStudyHints ?? this.showAiStudyHints,
    );
  }
}

@Riverpod(keepAlive: true)
class ReaderAssistSettingsNotifier extends _$ReaderAssistSettingsNotifier {
  static const String _legacyPersonKey = 'reader_person_annotations_enabled';
  static const String _chapterPeopleKey = 'reader_assist_chapter_people';
  static const String _chapterPlacesKey = 'reader_assist_chapter_places';
  static const String _lexiconKey = 'reader_assist_lexicon';
  static const String _aiStudyHintsKey = 'reader_assist_ai_study_hints';

  @override
  ReaderAssistSettings build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    return ReaderAssistSettings(
      showChapterPeople:
          prefs.getBool(_chapterPeopleKey) ??
          prefs.getBool(_legacyPersonKey) ??
          false,
      showChapterPlaces: prefs.getBool(_chapterPlacesKey) ?? false,
      showLexicon: prefs.getBool(_lexiconKey) ?? true,
      showAiStudyHints: prefs.getBool(_aiStudyHintsKey) ?? true,
    );
  }

  void updateChapterPeople(bool enabled) {
    state = state.copyWith(showChapterPeople: enabled);
    ref.read(sharedPreferencesProvider).setBool(_chapterPeopleKey, enabled);
  }

  void updateChapterPlaces(bool enabled) {
    state = state.copyWith(showChapterPlaces: enabled);
    ref.read(sharedPreferencesProvider).setBool(_chapterPlacesKey, enabled);
  }

  void updateLexicon(bool enabled) {
    state = state.copyWith(showLexicon: enabled);
    ref.read(sharedPreferencesProvider).setBool(_lexiconKey, enabled);
  }

  void updateAiStudyHints(bool enabled) {
    state = state.copyWith(showAiStudyHints: enabled);
    ref.read(sharedPreferencesProvider).setBool(_aiStudyHintsKey, enabled);
  }
}
