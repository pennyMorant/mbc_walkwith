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
        child: LayoutBuilder(
          builder: (context, constraints) {
            final textScale = MediaQuery.textScalerOf(context).scale(1);
            final stackHeader = constraints.maxWidth < 300 || textScale > 1.15;
            final title = Text(
              formatDateOnly(context, record.startsAt.toLocal()),
              style: Theme.of(context).textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            );
            final status = AppChip(
              label: servingAvailabilityStatusLabel(l10n, record.status),
              selected: record.status == 'preferred',
              variant: AppChipVariant.filled,
            );

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (stackHeader) ...[
                  title,
                  const SizedBox(height: 8),
                  Align(alignment: Alignment.centerLeft, child: status),
                ] else
                  Row(
                    children: [
                      Expanded(child: title),
                      const SizedBox(width: 10),
                      status,
                    ],
                  ),
                const SizedBox(height: 8),
                Text(
                  '${formatDateTime(context, record.startsAt.toLocal())} - '
                  '${formatDateTime(context, record.endsAt.toLocal())}',
                  style: Theme.of(context).textTheme.bodyMedium
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
                if (record.note.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(record.note),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}
