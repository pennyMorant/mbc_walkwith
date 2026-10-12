import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import '../../domain/bible_note.dart';

class SharedVerseNoteCard extends StatelessWidget {
  const SharedVerseNoteCard({super.key, required this.note});

  final BibleVerseNote note;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Material(
      color: note.isMine
          ? colorScheme.secondaryContainer.withValues(alpha: 0.5)
          : colorScheme.tintedCardColor,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.person_outline,
                  size: 18,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        note.authorDisplayName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelLarge
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatDateOnly(context, note.createdAt),
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                if (note.isMine)
                  AppChip(
                    label: l10n.verseNotesMineLabel,
                    selected: true,
                    icon: Icons.edit_note,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              note.content,
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(height: 1.55, color: colorScheme.onSurface),
            ),
          ],
        ),
      ),
    );
  }
}
