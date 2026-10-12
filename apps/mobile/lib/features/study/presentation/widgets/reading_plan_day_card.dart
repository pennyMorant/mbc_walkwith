import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/reading_plan.dart';

class ReadingPlanDayCard extends StatelessWidget {
  const ReadingPlanDayCard({
    super.key,
    required this.day,
    required this.completed,
    required this.busy,
    required this.canComplete,
    required this.onRead,
    required this.onComplete,
  });

  final ReadingPlanDay day;
  final bool completed;
  final bool busy;
  final bool canComplete;
  final VoidCallback? onRead;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      color: completed ? colorScheme.secondaryContainer : null,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                AppChip(label: l10n.readingPlanDayLabel(day.dayNumber)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    day.title.isEmpty
                        ? l10n.readingPlanDayLabel(day.dayNumber)
                        : day.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (completed)
                  AppChip(
                    label: l10n.readingPlanCompletedLabel,
                    selected: true,
                  ),
              ],
            ),
            if (day.description.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                day.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (day.references.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final reference in day.references)
                    AppChip(
                      icon: Icons.menu_book_outlined,
                      label: reference.displayLabel,
                      selected: true,
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              alignment: WrapAlignment.end,
              children: [
                AppButton(
                  label: l10n.readingPlanReadAction,
                  icon: Icons.auto_stories_outlined,
                  onPressed: onRead,
                ),
                AppButton(
                  label: completed
                      ? l10n.readingPlanCompletedLabel
                      : l10n.readingPlanCompleteDayAction,
                  icon: Icons.check_circle_outline,
                  loading: busy,
                  onPressed: canComplete && !completed ? onComplete : null,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
