import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/study_repository.dart';
import '../domain/bible_book.dart';
import '../domain/bible_person.dart';
import '../domain/bible_place.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';
import 'widgets/ai_study_sheet.dart';
import 'widgets/bible_person_sheet.dart';
import 'widgets/bible_place_sheet.dart';
import 'widgets/chapter_people_sheet.dart';
import 'widgets/chapter_places_sheet.dart';
import 'widgets/lexicon_bottom_sheet.dart';
import 'widgets/reader_settings_sheet.dart';
import 'widgets/verse_annotation_sheet.dart';
import 'widgets/verse_picker_sheet.dart';

class BibleReaderSheetActions {
  const BibleReaderSheetActions({
    required this.context,
    required this.ref,
    required this.isMounted,
    required this.readerScale,
    required this.onReaderScaleChanged,
    required this.scrollToTargetVerse,
  });

  final BuildContext context;
  final WidgetRef ref;
  final bool Function() isMounted;
  final double readerScale;
  final ValueChanged<double> onReaderScaleChanged;
  final Future<void> Function(String verseId) scrollToTargetVerse;

  void showReaderSettings() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return ReaderSettingsSheet(
          readerScale: readerScale,
          onReaderScaleChanged: onReaderScaleChanged,
        );
      },
    );
  }

  void showVersePicker(List<BibleVerse> verses) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (context) {
        return VersePickerSheet(
          verses: verses,
          onVerseSelected: (verse) {
            Navigator.of(context).pop();
            unawaited(scrollToTargetVerse(verse.id));
          },
        );
      },
    );
  }

  void showAiStudy({
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return AiStudySheet(
          book: book,
          chapter: chapter,
          verse: verse,
          translation: translation,
        );
      },
    );
  }

  void showPerson(BiblePerson person) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (context) => BiblePersonSheet(person: person),
    );
  }

  void showPlace(BiblePlace place) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (context) => BiblePlaceSheet(place: place),
    );
  }

  void showChapterPeople(List<BiblePerson> people) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (sheetContext) {
        return ChapterPeopleSheet(
          people: people,
          onPersonSelected: (person) {
            Navigator.of(sheetContext).pop();
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (isMounted()) {
                showPerson(person);
              }
            });
          },
        );
      },
    );
  }

  void showChapterPlaces(List<BiblePlace> places) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (sheetContext) {
        return ChapterPlacesSheet(
          places: places,
          onPlaceSelected: (place) {
            Navigator.of(sheetContext).pop();
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (isMounted()) {
                showPlace(place);
              }
            });
          },
        );
      },
    );
  }

  void showLexicon(BibleVerse verse) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => LexiconBottomSheet(verse: verse),
    );
  }

  void showVerseAnnotationSheet({
    required BibleVerse verse,
    required StudyAnnotationsRequest annotationsRequest,
    int initialTabIndex = 0,
    bool includeLexicon = false,
  }) {
    final annotation = ref
        .read(studyAnnotationsProvider(annotationsRequest))
        .maybeWhen(
          data: (annotations) => annotations[verse.id],
          orElse: () => null,
        );
    final repository = ref.read(studyRepositoryProvider);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (sheetContext) {
        return VerseAnnotationSheet(
          verse: verse,
          bookId: annotationsRequest.bookId,
          chapter: annotationsRequest.chapter,
          annotation: annotation,
          initialTabIndex: initialTabIndex,
          onBookmarkChanged: (isBookmarked) => setVerseBookmark(
            verse: verse,
            isBookmarked: isBookmarked,
            annotationsRequest: annotationsRequest,
          ),
          onHighlightChanged: (highlightColor) => setVerseHighlight(
            verse: verse,
            colorId: highlightColor,
            annotationsRequest: annotationsRequest,
          ),
          onNoteSaved: (noteText) {
            unawaited(
              repository
                  .saveVerseNote(verseId: verse.id, noteText: noteText)
                  .then((_) => _refreshAnnotations(annotationsRequest)),
            );
          },
          onOpenLexicon: includeLexicon && verse.hasLexicon
              ? () {
                  Navigator.of(sheetContext).pop();
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (isMounted()) {
                      showLexicon(verse);
                    }
                  });
                }
              : null,
        );
      },
    );
  }

  Future<void> setVerseBookmark({
    required BibleVerse verse,
    required bool isBookmarked,
    required StudyAnnotationsRequest annotationsRequest,
  }) {
    return ref
        .read(studyRepositoryProvider)
        .setVerseBookmark(verseId: verse.id, isBookmarked: isBookmarked)
        .then((_) => _refreshAnnotations(annotationsRequest));
  }

  Future<void> setVerseHighlight({
    required BibleVerse verse,
    required String? colorId,
    required StudyAnnotationsRequest annotationsRequest,
  }) {
    return ref
        .read(studyRepositoryProvider)
        .setVerseHighlight(verseId: verse.id, highlightColor: colorId)
        .then((_) => _refreshAnnotations(annotationsRequest));
  }

  void _refreshAnnotations(StudyAnnotationsRequest annotationsRequest) {
    if (!isMounted()) {
      return;
    }
    ref.invalidate(studyAnnotationsProvider(annotationsRequest));
  }
}
