import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/reading_plan.dart';

class ReadingPlanCard extends StatelessWidget {
  const ReadingPlanCard({
    super.key,
    required this.plan,
    required this.assignment,
    required this.onTap,
    required this.onContinue,
  });

  final ReadingPlan plan;
  final ReadingPlanAssignment assignment;
  final VoidCallback onTap;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.secondaryContainer,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final textScale = MediaQuery.textScalerOf(context).scale(1);
              final stackContent =
                  constraints.maxWidth < 300 || textScale > 1.15;
              final title = Text(
                plan.title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSecondaryContainer,
                  fontWeight: FontWeight.w800,
                ),
              );
              final duration = AppChip(
                label: l10n.readingPlanDaysLabel(plan.durationDays),
                selected: true,
              );
              final progress = AppChip(
                icon: Icons.done_all_outlined,
                label: l10n.readingPlanProgressLabel(
                  assignment.completedCount,
                  plan.durationDays,
                ),
                selected: true,
              );
              final continueButton = AppButton(
                label: l10n.readingPlanContinueAction,
                icon: Icons.arrow_forward_rounded,
                variant: AppButtonVariant.tonal,
                onPressed: onContinue,
              );

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (stackContent) ...[
                    title,
                    const SizedBox(height: 8),
                    duration,
                  ] else
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: title),
                        const SizedBox(width: 8),
                        duration,
                      ],
                    ),
                  if (plan.description.trim().isNotEmpty) ...[
                    const SizedBox(height: 7),
                    Text(
                      plan.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSecondaryContainer.withValues(
                          alpha: 0.82,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  if (stackContent) ...[
                    progress,
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: continueButton,
                    ),
                  ] else
                    Row(
                      children: [
                        Flexible(child: progress),
                        const SizedBox(width: 10),
                        continueButton,
                      ],
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
