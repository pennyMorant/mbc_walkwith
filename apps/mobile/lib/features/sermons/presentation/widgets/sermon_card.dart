import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/sermon.dart';

class SermonCard extends StatelessWidget {
  const SermonCard({
    super.key,
    required this.sermon,
    required this.selected,
    required this.onTap,
    this.savedPosition = Duration.zero,
  });

  final Sermon sermon;
  final bool selected;
  final VoidCallback onTap;
  final Duration savedPosition;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final summary = plainTextPreview(sermon.summary, maxLength: 92);
    final date = _formattedDate(context);

    return Card(
      color: selected ? colorScheme.secondaryContainer : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (sermon.primaryReference.trim().isNotEmpty)
                    AppChip(
                      label: sermon.primaryReference,
                      icon: Icons.menu_book_outlined,
                      selected: true,
                    ),
                  if (sermon.series.trim().isNotEmpty)
                    AppChip(label: sermon.series, icon: Icons.bookmark_outline),
                  if (date != null)
                    AppChip(label: date, icon: Icons.event_outlined),
                  if (sermon.duration > Duration.zero)
                    AppChip(
                      label: formatDurationClock(sermon.duration),
                      icon: Icons.schedule_outlined,
                    ),
                ],
              ),
              const SizedBox(height: 13),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      sermon.title,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: selected
                            ? colorScheme.onSecondaryContainer
                            : colorScheme.onSurface,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton.filledTonal(
                    tooltip: l10n.sermonOpenDetailAction,
                    onPressed: onTap,
                    icon: const Icon(Icons.chevron_right_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                sermon.speaker,
                style: textTheme.bodyMedium?.copyWith(
                  color: selected
                      ? colorScheme.onSecondaryContainer.withValues(alpha: 0.78)
                      : colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (summary.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  summary,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.bodyMedium?.copyWith(
                    color: selected
                        ? colorScheme.onSecondaryContainer.withValues(
                            alpha: 0.82,
                          )
                        : colorScheme.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
              if (_hasSavedProgress) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value:
                        savedPosition.inMilliseconds /
                        sermon.duration.inMilliseconds,
                    minHeight: 4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  formatDurationClock(savedPosition),
                  style: textTheme.labelMedium?.copyWith(
                    color: selected
                        ? colorScheme.onSecondaryContainer
                        : colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  bool get _hasSavedProgress {
    if (sermon.duration.inMilliseconds <= 0) {
      return false;
    }
    if (savedPosition <= const Duration(seconds: 5)) {
      return false;
    }
    return savedPosition < sermon.duration - const Duration(seconds: 15);
  }

  String? _formattedDate(BuildContext context) {
    final parsed = DateTime.tryParse(sermon.date);
    if (parsed == null) {
      return sermon.date.trim().isEmpty ? null : sermon.date;
    }
    return formatDateOnly(context, parsed.toLocal());
  }
}
