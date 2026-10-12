import 'package:flutter/material.dart';

import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'verse_highlight_options.dart';

class BibleVerseTile extends StatelessWidget {
  const BibleVerseTile({
    super.key,
    required this.verse,
    required this.readerScale,
    this.isHighlighted = false,
    this.annotation,
    this.onExplain,
    this.onOpenTools,
  });

  final BibleVerse verse;
  final double readerScale;
  final bool isHighlighted;
  final StudyVerseAnnotation? annotation;
  final VoidCallback? onExplain;
  final VoidCallback? onOpenTools;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textStyle = Theme.of(context).textTheme.bodyLarge
        ?.copyWith(fontSize: 18 * readerScale, height: 1.75, letterSpacing: 0);
    final highlightColor = studyHighlightColor(
      context,
      annotation?.highlightColor,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: isHighlighted
              ? colorScheme.primaryContainer.withValues(alpha: 0.42)
              : highlightColor?.withValues(alpha: 0.72) ?? Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onLongPress: onExplain,
          onTap: onOpenTools,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 36,
                      child: Text(
                        '${verse.number}',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Expanded(child: Text(verse.text, style: textStyle)),
                  ],
                ),
                if (_hasAnnotationIndicator(annotation)) ...[
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(left: 36),
                    child: _AnnotationIndicators(annotation: annotation!),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

bool _hasAnnotationIndicator(StudyVerseAnnotation? annotation) {
  if (annotation == null) {
    return false;
  }
  return annotation.isBookmarked ||
      annotation.hasHighlight ||
      annotation.hasNote;
}

class _AnnotationIndicators extends StatelessWidget {
  const _AnnotationIndicators({required this.annotation});

  final StudyVerseAnnotation annotation;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        if (annotation.isBookmarked)
          Icon(Icons.bookmark, size: 18, color: colorScheme.primary),
        if (annotation.hasHighlight)
          Icon(Icons.format_color_fill, size: 18, color: colorScheme.primary),
        if (annotation.hasNote)
          Icon(
            Icons.sticky_note_2_outlined,
            size: 18,
            color: colorScheme.primary,
          ),
      ],
    );
  }
}
