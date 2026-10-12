import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class VerseHighlightChip extends StatelessWidget {
  const VerseHighlightChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.color,
  });

  final String label;
  final bool selected;
  final VoidCallback onSelected;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final chipColor = color ?? colorScheme.surfaceContainerHighest;

    return FilterChip(
      selected: selected,
      label: Text(label),
      avatar: color == null
          ? null
          : CircleAvatar(backgroundColor: color, radius: 7),
      backgroundColor: chipColor.withValues(alpha: 0.36),
      selectedColor: color == null
          ? colorScheme.secondaryContainer
          : chipColor.withValues(alpha: 0.72),
      onSelected: (_) => onSelected(),
    );
  }
}

class VerseHighlightOption {
  const VerseHighlightOption({
    required this.id,
    required this.label,
    required this.color,
  });

  final String id;
  final String label;
  final Color color;
}

List<VerseHighlightOption> verseHighlightOptions(BuildContext context) {
  final l10n = AppLocalizations.of(context)!;
  final colorScheme = Theme.of(context).colorScheme;

  return [
    VerseHighlightOption(
      id: 'yellow',
      label: l10n.highlightYellow,
      color: Color.alphaBlend(
        Colors.amber.withValues(alpha: 0.46),
        colorScheme.surface,
      ),
    ),
    VerseHighlightOption(
      id: 'green',
      label: l10n.highlightGreen,
      color: Color.alphaBlend(
        Colors.green.withValues(alpha: 0.34),
        colorScheme.surface,
      ),
    ),
    VerseHighlightOption(
      id: 'blue',
      label: l10n.highlightBlue,
      color: Color.alphaBlend(
        Colors.blue.withValues(alpha: 0.32),
        colorScheme.surface,
      ),
    ),
    VerseHighlightOption(
      id: 'rose',
      label: l10n.highlightRose,
      color: Color.alphaBlend(
        Colors.pink.withValues(alpha: 0.28),
        colorScheme.surface,
      ),
    ),
  ];
}

Color? studyHighlightColor(BuildContext context, String? colorId) {
  if (colorId == null || colorId.isEmpty) {
    return null;
  }

  return verseHighlightOptions(
    context,
  ).where((option) => option.id == colorId).firstOrNull?.color;
}
