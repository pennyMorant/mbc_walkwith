import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../study/data/reading_plan_repository.dart';
import '../../../study/domain/reading_plan.dart';
import 'reading_plan_assignment_card.dart';

class ReadingPlanHistorySheet extends ConsumerWidget {
  const ReadingPlanHistorySheet({
    super.key,
    required this.assignmentId,
    required this.onRestart,
  });

  final String assignmentId;
  final ValueChanged<ReadingPlanAssignment> onRestart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(
      readingPlanAssignmentDetailProvider(assignmentId),
    );
    final bottomPadding = MediaQuery.paddingOf(context).bottom;

    return SafeArea(
      top: false,
      child: FractionallySizedBox(
        heightFactor: 0.85,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, 20 + bottomPadding),
          child: detailAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(
              child: AppButton(
                label: AppLocalizations.of(context)!.retryAction,
                icon: Icons.refresh,
                onPressed: () => ref.invalidate(
                  readingPlanAssignmentDetailProvider(assignmentId),
                ),
              ),
            ),
            data: (detail) => _HistoryContent(
              detail: detail,
              onRestart: () => onRestart(detail.assignment),
            ),
          ),
        ),
      ),
    );
  }
}

class _HistoryContent extends StatelessWidget {
  const _HistoryContent({required this.detail, required this.onRestart});

  final ReadingPlanAssignmentDetail detail;
  final VoidCallback onRestart;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final assignment = detail.assignment;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 36,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        Text(
          assignment.planTitle,
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            AppChip(
              label: readingPlanStatusLabel(l10n, assignment.status),
              selected: assignment.status == 'completed',
            ),
            AppChip(
              label: l10n.readingPlanProgressLabel(
                assignment.completedCount,
                assignment.planDurationDays,
              ),
            ),
            if (assignment.endedAt != null)
              AppChip(
                label: l10n.readingPlanEndedOn(
                  formatDateOnly(context, assignment.endedAt!),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.separated(
            itemCount: detail.days.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final day = detail.days[index];
              final progress = assignment.progressForDay(day.id);
              return _HistoryDay(day: day, progress: progress);
            },
          ),
        ),
        if (detail.canRestart) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: l10n.readingPlanRestartAction,
              icon: Icons.replay_rounded,
              variant: AppButtonVariant.filled,
              onPressed: onRestart,
            ),
          ),
        ],
      ],
    );
  }
}

class _HistoryDay extends StatelessWidget {
  const _HistoryDay({required this.day, required this.progress});

  final ReadingPlanDay day;
  final ReadingPlanDayProgress? progress;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final referenceText = day.references
        .map((reference) => reference.displayLabel)
        .join(' · ');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    day.title.trim().isEmpty
                        ? l10n.readingPlanDayLabel(day.dayNumber)
                        : day.title,
                    style: Theme.of(context).textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                if (progress?.isCompleted ?? false)
                  const Icon(Icons.check_circle_rounded, size: 20),
              ],
            ),
            if (referenceText.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(referenceText),
            ],
            if ((progress?.note.trim().isNotEmpty ?? false)) ...[
              const SizedBox(height: 10),
              Text(
                '${l10n.readingPlanNoteLabel}: ${progress!.note}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
