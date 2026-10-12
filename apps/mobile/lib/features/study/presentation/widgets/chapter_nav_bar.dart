import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import '../../domain/bible_book.dart';
import '../bible_book_display.dart';

class ChapterNavBar extends StatelessWidget {
  const ChapterNavBar({
    super.key,
    required this.book,
    required this.chapter,
    required this.useEnglishNames,
    required this.onChapterSelected,
  });

  final BibleBook book;
  final int chapter;
  final bool useEnglishNames;
  final ValueChanged<int> onChapterSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final bookName = bibleBookDisplayName(
      book,
      useEnglishNames: useEnglishNames,
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.tintedCardColor,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        ),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              IconButton(
                tooltip: l10n.previousChapterTooltip,
                onPressed: chapter > 1
                    ? () => onChapterSelected(chapter - 1)
                    : null,
                icon: const Icon(Icons.chevron_left),
              ),
              Expanded(
                child: Text(
                  l10n.bibleChapterReference(bookName, chapter),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                tooltip: l10n.nextChapterTooltip,
                onPressed: chapter < book.chapterCount
                    ? () => onChapterSelected(chapter + 1)
                    : null,
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
