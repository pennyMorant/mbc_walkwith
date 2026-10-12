import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/serving_availability.dart';
import '../serving_presenters.dart';

class ServingAvailabilityCard extends StatelessWidget {
  const ServingAvailabilityCard({super.key, required this.record});

  final ServingAvailability record;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    formatDateOnly(context, record.startsAt.toLocal()),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                AppChip(
                  label: servingAvailabilityStatusLabel(l10n, record.status),
                  selected: record.status == 'preferred',
                  variant: AppChipVariant.filled,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${formatDateTime(context, record.startsAt.toLocal())} - '
              '${formatDateTime(context, record.endsAt.toLocal())}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (record.note.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(record.note),
            ],
          ],
        ),
      ),
    );
  }
}
