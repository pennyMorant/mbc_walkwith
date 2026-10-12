import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class VerseAnnotationHeader extends StatelessWidget {
  const VerseAnnotationHeader({
    super.key,
    required this.verseNumber,
    this.onOpenLexicon,
  });

  final int verseNumber;
  final VoidCallback? onOpenLexicon;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 36,
            height: 4,
            decoration: ShapeDecoration(
              color: colorScheme.outlineVariant,
              shape: const StadiumBorder(),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.verseActionsTitle,
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
            if (onOpenLexicon != null)
              IconButton(
                tooltip: l10n.lexiconAssistTitle,
                onPressed: onOpenLexicon,
                icon: const Icon(Icons.travel_explore),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          l10n.verseNumberLabel(verseNumber),
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: colorScheme.primary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
