import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_button.dart';
import '../../domain/bible_book.dart';
import '../bible_book_display.dart';

class BibleBookTile extends StatelessWidget {
  const BibleBookTile({
    super.key,
    required this.book,
    required this.selected,
    required this.useEnglishNames,
    required this.onTap,
  });

  final BibleBook book;
  final bool selected;
  final bool useEnglishNames;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = bibleBookDisplayName(book, useEnglishNames: useEnglishNames);

    return AppButton(
      label: label,
      selected: selected,
      variant: AppButtonVariant.tonal,
      shape: AppButtonShape.stadium,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      textStyle: Theme.of(
        context,
      ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
      onPressed: onTap,
    );
  }
}
