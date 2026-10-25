import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../sermons/data/sermons_repository.dart';
import '../../sermons/domain/sermon.dart';
import '../data/bible_people_repository.dart';
import '../data/bible_places_repository.dart';
import '../data/study_repository.dart';
import '../domain/bible_book.dart';
import '../domain/bible_person.dart';
import '../domain/bible_person_matcher.dart';
import '../domain/bible_place.dart';
import '../domain/bible_place_matcher.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';
import '../domain/study_annotation.dart';
import 'reader_assist_settings_provider.dart';

class BibleReaderChapterState {
  const BibleReaderChapterState({
    required this.translation,
    required this.bookRequest,
    required this.chapterRequest,
    required this.annotationsRequest,
    required this.book,
    required this.verses,
    required this.annotations,
    required this.recommendedSermons,
    required this.readerAssistSettings,
    required this.chapterPeople,
    required this.chapterPlaces,
  });

  final BibleTranslation translation;
  final BibleBookRequest bookRequest;
  final BibleChapterRequest chapterRequest;
  final StudyAnnotationsRequest annotationsRequest;
  final AsyncValue<BibleBook> book;
  final AsyncValue<List<BibleVerse>> verses;
  final Map<String, StudyVerseAnnotation> annotations;
  final List<Sermon> recommendedSermons;
  final ReaderAssistSettings readerAssistSettings;
  final List<BiblePerson> chapterPeople;
  final List<BiblePlace> chapterPlaces;

  static BibleReaderChapterState watch({
    required WidgetRef ref,
    required Locale locale,
    required String bookId,
    required int chapter,
    required String? targetVerseId,
  }) {
    final translation = BibleTranslation.fromLocale(locale);
    final bookRequest = BibleBookRequest(
      bookId: bookId,
      translationId: translation.id,
    );
    final chapterRequest = BibleChapterRequest(
      bookId: bookId,
      chapter: chapter,
      translationId: translation.id,
    );
    final annotationsRequest = StudyAnnotationsRequest(
      bookId: bookId,
      chapter: chapter,
    );
    final book = ref.watch(bibleBookProvider(bookRequest));
    final verses = ref.watch(bibleChapterVersesProvider(chapterRequest));
    final annotations = ref
        .watch(studyAnnotationsProvider(annotationsRequest))
        .maybeWhen(
          data: (value) => value,
          orElse: () => const <String, StudyVerseAnnotation>{},
        );
    final recommendedSermons = ref
        .watch(
          recommendedSermonsProvider(
            SermonRecommendationRequest(
              bookId: bookId,
              chapter: chapter,
              verseId: targetVerseId,
            ),
          ),
        )
        .maybeWhen(data: (value) => value, orElse: () => const <Sermon>[]);
    final settings = ref.watch(readerAssistSettingsProvider);
    final people = settings.showChapterPeople
        ? ref
              .watch(biblePeopleProvider(translation.id))
              .maybeWhen(
                data: (value) => value,
                orElse: () => const <BiblePerson>[],
              )
        : const <BiblePerson>[];
    final places = settings.showChapterPlaces
        ? ref
              .watch(biblePlacesProvider(translation.id))
              .maybeWhen(
                data: (value) => value,
                orElse: () => const <BiblePlace>[],
              )
        : const <BiblePlace>[];

    return BibleReaderChapterState(
      translation: translation,
      bookRequest: bookRequest,
      chapterRequest: chapterRequest,
      annotationsRequest: annotationsRequest,
      book: book,
      verses: verses,
      annotations: annotations,
      recommendedSermons: recommendedSermons,
      readerAssistSettings: settings,
      chapterPeople: settings.showChapterPeople && people.isNotEmpty
          ? verses.maybeWhen(
              data: (value) =>
                  findUniqueBiblePeopleInChapter(verses: value, people: people),
              orElse: () => const <BiblePerson>[],
            )
          : const <BiblePerson>[],
      chapterPlaces: settings.showChapterPlaces && places.isNotEmpty
          ? verses.maybeWhen(
              data: (value) =>
                  findUniqueBiblePlacesInChapter(verses: value, places: places),
              orElse: () => const <BiblePlace>[],
            )
          : const <BiblePlace>[],
    );
  }
}
