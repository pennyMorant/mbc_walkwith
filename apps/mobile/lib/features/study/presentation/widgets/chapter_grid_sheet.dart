import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../theme/app_colors.dart';
import '../../domain/bible_book.dart';
import '../bible_book_display.dart';

class ChapterGridSheet extends StatelessWidget {
  const ChapterGridSheet({
    super.key,
    required this.book,
    required this.useEnglishNames,
    required this.onChapterSelected,
    this.currentChapter,
  });

  final BibleBook book;
  final bool useEnglishNames;
  final ValueChanged<int> onChapterSelected;
  final int? currentChapter;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final bottomPadding = MediaQuery.paddingOf(context).bottom;
    final height = MediaQuery.sizeOf(context).height * 0.5;
    final bookName = bibleBookDisplayName(
      book,
      useEnglishNames: useEnglishNames,
    );

    return SizedBox(
      height: height,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 32,
                height: 4,
                margin: const EdgeInsets.only(top: 8, bottom: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: Text(
                    bookName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                AppChip(
                  label: l10n.bibleChapterCountLabel(book.chapterCount),
                  selected: true,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  if (constraints.maxWidth <= 0) {
                    return const SizedBox.shrink();
                  }

                  return GridView.builder(
                    padding: EdgeInsets.only(bottom: 20 + bottomPadding),
                    itemCount: book.chapterCount,
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 72,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.2,
                        ),
                    itemBuilder: (context, index) {
                      final colorScheme = Theme.of(context).colorScheme;
                      final chapter = index + 1;
                      return AppButton(
                        label: '$chapter',
                        semanticLabel: l10n.bibleChapterButtonSemanticLabel(
                          bookName,
                          chapter,
                        ),
                        selected: chapter == currentChapter,
                        variant: AppButtonVariant.tonal,
                        shape: AppButtonShape.stadium,
                        minHeight: 44,
                        padding: EdgeInsets.zero,
                        backgroundColor: colorScheme.tintedCardColor,
                        foregroundColor: colorScheme.onSurface,
                        onPressed: () => onChapterSelected(chapter),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
