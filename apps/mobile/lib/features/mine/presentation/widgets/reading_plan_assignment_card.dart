import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../study/domain/reading_plan.dart';

class ReadingPlanAssignmentCard extends StatelessWidget {
  const ReadingPlanAssignmentCard({
    super.key,
    required this.assignment,
    required this.onTap,
    this.onPause,
    this.onResume,
    this.onAbandon,
  });

  final ReadingPlanAssignment assignment;
  final VoidCallback onTap;
  final VoidCallback? onPause;
  final VoidCallback? onResume;
  final VoidCallback? onAbandon;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final progress = assignment.planDurationDays == 0
        ? 0.0
        : assignment.completedCount / assignment.planDurationDays;
    final eventDate = assignment.endedAt ?? assignment.startedAt;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      assignment.planTitle,
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (onPause != null || onResume != null || onAbandon != null)
                    PopupMenuButton<_AssignmentAction>(
                      tooltip: MaterialLocalizations.of(context)
                          .showMenuTooltip,
                      onSelected: (action) {
                        switch (action) {
                          case _AssignmentAction.pause:
                            onPause?.call();
                            return;
                          case _AssignmentAction.resume:
                            onResume?.call();
                            return;
                          case _AssignmentAction.abandon:
                            onAbandon?.call();
                            return;
                        }
                      },
                      itemBuilder: (context) => [
                        if (onPause != null)
                          PopupMenuItem(
                            value: _AssignmentAction.pause,
                            child: Text(l10n.readingPlanPauseAction),
                          ),
                        if (onResume != null)
                          PopupMenuItem(
                            value: _AssignmentAction.resume,
                            child: Text(l10n.readingPlanResumeAction),
                          ),
                        if (onAbandon != null)
                          PopupMenuItem(
                            value: _AssignmentAction.abandon,
                            child: Text(l10n.readingPlanAbandonAction),
                          ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  AppChip(
                    label: readingPlanStatusLabel(l10n, assignment.status),
                    selected:
                        assignment.status == 'active' ||
                        assignment.status == 'completed',
                  ),
                  if (assignment.attemptNumber > 1)
                    AppChip(
                      label: l10n.readingPlanAttemptLabel(
                        assignment.attemptNumber,
                      ),
                    ),
                  if (eventDate != null)
                    AppChip(
                      label: assignment.isHistory
                          ? l10n.readingPlanEndedOn(
                              formatDateOnly(context, eventDate),
                            )
                          : l10n.readingPlanStartedOn(
                              formatDateOnly(context, eventDate),
                            ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              LinearProgressIndicator(
                value: progress.clamp(0, 1),
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
                backgroundColor: colorScheme.surfaceContainerHighest,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.readingPlanProgressLabel(
                  assignment.completedCount,
                  assignment.planDurationDays,
                ),
                style: Theme.of(context).textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String readingPlanStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'not_started' => l10n.readingPlanNotStartedLabel,
    'active' => l10n.readingPlanActiveLabel,
    'paused' => l10n.readingPlanPausedLabel,
    'completed' => l10n.readingPlanCompletedLabel,
    'abandoned' => l10n.readingPlanAbandonedLabel,
    _ => status,
  };
}

enum _AssignmentAction { pause, resume, abandon }
