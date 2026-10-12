import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/bible_book.dart';
import '../bible_book_display.dart';

class StudyChapterHeader extends StatelessWidget {
  const StudyChapterHeader({
    super.key,
    required this.book,
    required this.chapter,
    required this.useEnglishNames,
    required this.translationLabel,
    required this.relatedSermonCount,
  });

  final BibleBook book;
  final int chapter;
  final bool useEnglishNames;
  final String translationLabel;
  final int relatedSermonCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final bookName = bibleBookDisplayName(
      book,
      useEnglishNames: useEnglishNames,
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppChip(
                label: l10n.bibleChapterReference(bookName, chapter),
                icon: Icons.auto_stories_outlined,
                selected: true,
              ),
              AppChip(label: translationLabel, icon: Icons.translate),
              if (relatedSermonCount > 0)
                AppChip(
                  label: l10n.relatedSermonsLabel(relatedSermonCount),
                  icon: Icons.graphic_eq,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
