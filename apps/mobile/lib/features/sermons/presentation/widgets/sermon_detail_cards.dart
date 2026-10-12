import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/sermon.dart';

class SermonHeaderCard extends StatelessWidget {
  const SermonHeaderCard({super.key, required this.sermon});

  final Sermon sermon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final date = _formattedDate(context, sermon.date);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
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
            const SizedBox(height: 16),
            Text(
              sermon.title,
              style: textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            if (sermon.speaker.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                sermon.speaker,
                style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class SermonSummaryCard extends StatelessWidget {
  const SermonSummaryCard({super.key, required this.sermon});

  final Sermon sermon;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.sermonSummaryTitle,
                style: textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                sermon.summary.trim(),
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String? _formattedDate(BuildContext context, String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return value.trim().isEmpty ? null : value;
  }
  return formatDateOnly(context, parsed.toLocal());
}
