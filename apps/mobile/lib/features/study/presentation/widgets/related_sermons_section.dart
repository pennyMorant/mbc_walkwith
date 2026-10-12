import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import '../../../sermons/domain/sermon.dart';

class RelatedSermonsSection extends StatelessWidget {
  const RelatedSermonsSection({
    super.key,
    required this.sermons,
    required this.onReferenceSelected,
  });

  final List<Sermon> sermons;
  final ValueChanged<SermonReference> onReferenceSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.relatedSermonsTitle,
            style: Theme.of(context).textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          for (final sermon in sermons)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: colorScheme.tintedCardColor,
                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        sermon.title,
                        style: Theme.of(context).textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${sermon.primaryReference} · ${sermon.speaker}',
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      if (sermon.summary.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          sermon.summary,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      if (sermon.references.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final reference in sermon.references.take(3))
                              ActionChip(
                                avatar: const Icon(Icons.menu_book_outlined),
                                label: Text(reference.reference),
                                onPressed: () => onReferenceSelected(reference),
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
