import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../data/reading_plan_repository.dart';
import '../../domain/reading_plan.dart';
import 'reading_plan_day_card.dart';

class ReadingPlanDetailSheet extends ConsumerStatefulWidget {
  const ReadingPlanDetailSheet({
    super.key,
    required this.plan,
    required this.onOpenReference,
  });

  final ReadingPlan plan;
  final ValueChanged<ScriptureReference> onOpenReference;

  @override
  ConsumerState<ReadingPlanDetailSheet> createState() {
    return _ReadingPlanDetailSheetState();
  }
}

class _ReadingPlanDetailSheetState
    extends ConsumerState<ReadingPlanDetailSheet> {
  String? _busyDayId;
  bool _starting = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final bottomPadding = MediaQuery.paddingOf(context).bottom;
    final daysAsync = ref.watch(readingPlanDaysProvider(widget.plan.id));
    final assignmentsAsync = ref.watch(activeReadingPlanAssignmentsProvider);
    final assignment = assignmentForPlan(
      assignmentsAsync.value ?? const <ReadingPlanAssignment>[],
      widget.plan.id,
    );

    return SafeArea(
      top: false,
      child: FractionallySizedBox(
        heightFactor: 0.85,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, 20 + bottomPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                widget.plan.title,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              if (widget.plan.description.trim().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  widget.plan.description,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  AppChip(
                    icon: Icons.calendar_month_outlined,
                    label: l10n.readingPlanDaysLabel(widget.plan.durationDays),
                    selected: true,
                  ),
                  if (assignment != null)
                    AppChip(
                      icon: Icons.done_all_outlined,
                      label: l10n.readingPlanProgressLabel(
                        assignment.completedCount,
                        widget.plan.durationDays,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              if (!assignmentsAsync.isLoading &&
                  !assignmentsAsync.hasError &&
                  assignment == null)
                AppButton(
                  label: l10n.readingPlanStartAction,
                  icon: Icons.playlist_add_check_circle_outlined,
                  variant: AppButtonVariant.filled,
                  loading: _starting,
                  onPressed: _startPlan,
                ),
              const SizedBox(height: 12),
              Expanded(
                child: assignmentsAsync.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : assignmentsAsync.hasError
                    ? _SheetError(
                        onRetry: () => ref.invalidate(
                          activeReadingPlanAssignmentsProvider,
                        ),
                      )
                    : daysAsync.when(
                        loading: () =>
                            const Center(child: CircularProgressIndicator()),
                        error: (error, stackTrace) => _SheetError(
                          onRetry: () {
                            ref.invalidate(
                              readingPlanDaysProvider(widget.plan.id),
                            );
                          },
                        ),
                        data: (days) => days.isEmpty
                            ? _EmptyDays(message: l10n.readingPlanNoDaysBody)
                            : ListView.separated(
                                itemCount: days.length,
                                separatorBuilder: (context, index) {
                                  return const SizedBox(height: 10);
                                },
                                itemBuilder: (context, index) {
                                  final day = days[index];
                                  final progress = assignment?.progressForDay(
                                    day.id,
                                  );
                                  return ReadingPlanDayCard(
                                    day: day,
                                    completed: progress?.isCompleted ?? false,
                                    busy: _busyDayId == day.id,
                                    canComplete:
                                        assignment?.isInProgress ?? false,
                                    onRead: day.references.isEmpty
                                        ? null
                                        : () => widget.onOpenReference(
                                            day.references.first,
                                          ),
                                    onComplete:
                                        !(assignment?.isInProgress ?? false)
                                        ? null
                                        : () => _completeDay(assignment!, day),
                                  );
                                },
                              ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _startPlan() async {
    setState(() => _starting = true);
    try {
      final identity = await readReadingPlanIdentityForAction(ref);
      await ref
          .read(readingPlanRepositoryProvider)
          .selfAssign(widget.plan.id, identity);
      invalidateReadingPlanAssignmentProviders(ref);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.readingPlanActionError),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _starting = false);
      }
    }
  }

  Future<void> _completeDay(
    ReadingPlanAssignment assignment,
    ReadingPlanDay day,
  ) async {
    setState(() => _busyDayId = day.id);
    try {
      final identity = await readReadingPlanIdentityForAction(ref);
      await ref
          .read(readingPlanRepositoryProvider)
          .updateDayProgress(
            assignmentId: assignment.id,
            dayId: day.id,
            status: 'completed',
            identity: identity,
          );
      invalidateReadingPlanAssignmentProviders(ref);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.readingPlanActionError),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busyDayId = null);
      }
    }
  }
}

class _SheetError extends StatelessWidget {
  const _SheetError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: AppButton(
        label: l10n.retryAction,
        icon: Icons.refresh,
        onPressed: onRetry,
      ),
    );
  }
}

class _EmptyDays extends StatelessWidget {
  const _EmptyDays({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodyMedium
            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
    );
  }
}
