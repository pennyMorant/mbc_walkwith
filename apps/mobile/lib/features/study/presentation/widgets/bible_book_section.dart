import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/bible_book.dart';
import 'bible_book_tile.dart';

class BibleBookSection extends StatelessWidget {
  const BibleBookSection({
    super.key,
    required this.title,
    required this.books,
    required this.currentBookId,
    required this.useEnglishNames,
    required this.onBookSelected,
  });

  final String title;
  final List<BibleBook> books;
  final String? currentBookId;
  final bool useEnglishNames;
  final ValueChanged<BibleBook> onBookSelected;

  @override
  Widget build(BuildContext context) {
    if (books.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return SliverLayoutBuilder(
      builder: (context, constraints) {
        if (constraints.crossAxisExtent <= 0) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        return SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          sliver: SliverToBoxAdapter(
            child: Card(
              clipBehavior: Clip.antiAlias,
              color: colorScheme.tintedCardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                        AppChip(
                          label: l10n.bibleBookCountLabel(books.length),
                          selected: true,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        for (final book in books)
                          BibleBookTile(
                            book: book,
                            selected: book.id == currentBookId,
                            useEnglishNames: useEnglishNames,
                            onTap: () => onBookSelected(book),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
