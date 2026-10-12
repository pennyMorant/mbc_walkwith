import 'package:flutter/material.dart';

import '../../../sermons/domain/sermon.dart';
import '../../data/bible_tts_controller.dart';
import '../../domain/bible_book.dart';
import '../../domain/bible_translation.dart';
import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'bible_tts_bar.dart';
import 'bible_verse_list.dart';
import 'chapter_nav_bar.dart';
import 'empty_chapter_view.dart';
import 'related_sermons_section.dart';
import 'study_chapter_header.dart';

class BibleReaderContentView extends StatelessWidget {
  const BibleReaderContentView({
    super.key,
    required this.bookId,
    required this.chapter,
    required this.book,
    required this.translation,
    required this.verses,
    required this.scrollController,
    required this.recommendedSermons,
    required this.annotations,
    required this.ttsState,
    required this.readerScale,
    required this.highlightedVerseId,
    required this.currentTtsVerseNumber,
    required this.verseKey,
    required this.onPlayTts,
    required this.onPauseTts,
    required this.onStopTts,
    required this.onPreviousTts,
    required this.onNextTts,
    required this.onTtsRateChanged,
    required this.onOpenVerseTools,
    required this.onSermonReferenceSelected,
    required this.onChapterSelected,
  });

  final String bookId;
  final int chapter;
  final BibleBook book;
  final BibleTranslation translation;
  final List<BibleVerse> verses;
  final ScrollController scrollController;
  final List<Sermon> recommendedSermons;
  final Map<String, StudyVerseAnnotation> annotations;
  final BibleTtsState ttsState;
  final double readerScale;
  final String? highlightedVerseId;
  final int? currentTtsVerseNumber;
  final GlobalKey Function(String verseId) verseKey;
  final VoidCallback onPlayTts;
  final VoidCallback onPauseTts;
  final VoidCallback onStopTts;
  final VoidCallback onPreviousTts;
  final VoidCallback onNextTts;
  final ValueChanged<double> onTtsRateChanged;
  final ValueChanged<BibleVerse> onOpenVerseTools;
  final ValueChanged<SermonReference> onSermonReferenceSelected;
  final ValueChanged<int> onChapterSelected;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      key: ValueKey('reader-content-$bookId-$chapter'),
      controller: scrollController,
      slivers: [
        SliverToBoxAdapter(
          child: StudyChapterHeader(
            book: book,
            chapter: chapter,
            useEnglishNames: translation.usesEnglishNames,
            translationLabel: translation.abbreviation,
            relatedSermonCount: recommendedSermons.length,
          ),
        ),
        if (verses.isNotEmpty)
          SliverToBoxAdapter(
            child: BibleTtsBar(
              status: ttsState.status,
              errorCode: ttsState.errorCode,
              rate: ttsState.rate,
              currentVerseNumber: currentTtsVerseNumber,
              onPlay: onPlayTts,
              onPause: onPauseTts,
              onStop: onStopTts,
              onPrevious: onPreviousTts,
              onNext: onNextTts,
              onRateChanged: onTtsRateChanged,
            ),
          ),
        if (verses.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyChapterView(),
          )
        else
          SliverToBoxAdapter(
            child: BibleVerseList(
              verses: verses,
              readerScale: readerScale,
              highlightedVerseId: highlightedVerseId,
              currentTtsVerseId: ttsState.currentVerseId,
              annotations: annotations,
              verseKey: verseKey,
              onExplainVerse: null,
              onOpenVerseTools: onOpenVerseTools,
            ),
          ),
        if (recommendedSermons.isNotEmpty)
          SliverToBoxAdapter(
            child: RelatedSermonsSection(
              sermons: recommendedSermons,
              onReferenceSelected: onSermonReferenceSelected,
            ),
          ),
        SliverToBoxAdapter(
          child: ChapterNavBar(
            book: book,
            chapter: chapter,
            useEnglishNames: translation.usesEnglishNames,
            onChapterSelected: onChapterSelected,
          ),
        ),
      ],
    );
  }
}
