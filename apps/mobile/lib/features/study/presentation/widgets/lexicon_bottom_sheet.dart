import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/bible_verse.dart';

class LexiconBottomSheet extends StatelessWidget {
  const LexiconBottomSheet({super.key, required this.verse});

  final BibleVerse verse;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isLoveVerse = verse.id == 'rom.8.39';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isLoveVerse ? l10n.lexiconLoveTitle : l10n.lexiconGoodTitle,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(isLoveVerse ? l10n.lexiconLoveBody : l10n.lexiconGoodBody),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.check),
            label: Text(l10n.confirmKnown),
          ),
        ],
      ),
    );
  }
}
