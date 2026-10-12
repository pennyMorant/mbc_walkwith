import 'package:flutter/material.dart';

import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'bible_verse_tile.dart';

class BibleVerseList extends StatelessWidget {
  const BibleVerseList({
    super.key,
    required this.verses,
    required this.readerScale,
    required this.highlightedVerseId,
    required this.currentTtsVerseId,
    required this.annotations,
    required this.verseKey,
    required this.onExplainVerse,
    required this.onOpenVerseTools,
  });

  final List<BibleVerse> verses;
  final double readerScale;
  final String? highlightedVerseId;
  final String? currentTtsVerseId;
  final Map<String, StudyVerseAnnotation> annotations;
  final GlobalKey Function(String verseId) verseKey;
  final ValueChanged<BibleVerse>? onExplainVerse;
  final ValueChanged<BibleVerse> onOpenVerseTools;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final verse in verses) ...[
          KeyedSubtree(
            key: verseKey(verse.id),
            child: BibleVerseTile(
              verse: verse,
              readerScale: readerScale,
              isHighlighted:
                  verse.id == highlightedVerseId ||
                  verse.id == currentTtsVerseId,
              annotation: annotations[verse.id],
              onExplain: onExplainVerse == null
                  ? null
                  : () => onExplainVerse!(verse),
              onOpenTools: () => onOpenVerseTools(verse),
            ),
          ),
          const SizedBox(height: 4),
        ],
      ],
    );
  }
}
