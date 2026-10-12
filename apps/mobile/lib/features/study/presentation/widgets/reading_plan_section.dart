import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../theme/app_colors.dart';
import '../../data/reading_plan_repository.dart';
import '../../domain/reading_plan.dart';
import 'reading_plan_card.dart';
import 'reading_plan_detail_sheet.dart';

class ReadingPlanSection extends ConsumerWidget {
  const ReadingPlanSection({super.key, required this.onOpenReference});

  final ValueChanged<ScriptureReference> onOpenReference;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final assignmentsAsync = ref.watch(activeReadingPlanAssignmentsProvider);
    return assignmentsAsync.when(
      loading: _hiddenReadingPlanSliver,
      error: (error, stackTrace) => _readingPlanCard(
        context,
        _ReadingPlanError(
          onRetry: () => ref.invalidate(activeReadingPlanAssignmentsProvider),
        ),
      ),
      data: (assignments) {
        final activeAssignments = assignments
            .where((assignment) => assignment.isInProgress)
            .toList();
        if (activeAssignments.isEmpty) {
          return _hiddenReadingPlanSliver();
        }

        final plansAsync = ref.watch(publishedReadingPlansProvider);
        return plansAsync.when(
          loading: _hiddenReadingPlanSliver,
          error: (error, stackTrace) => _readingPlanCard(
            context,
            _ReadingPlanError(
              onRetry: () => ref.invalidate(publishedReadingPlansProvider),
            ),
          ),
          data: (plans) {
            final assignmentsByPlanId = {
              for (final assignment in activeAssignments)
                assignment.planId: assignment,
            };
            final visiblePlans = plans
                .where((plan) => assignmentsByPlanId.containsKey(plan.id))
                .take(3)
                .toList();
            if (visiblePlans.isEmpty) {
              return _hiddenReadingPlanSliver();
            }

            return _readingPlanCard(
              context,
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.readingPlansTitle,
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.readingPlansBody,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 14),
                  for (final plan in visiblePlans) ...[
                    ReadingPlanCard(
                      plan: plan,
                      assignment: assignmentsByPlanId[plan.id]!,
                      onTap: () => _openPlan(context, plan),
                      onContinue: () => _openPlan(context, plan),
                    ),
                    if (plan != visiblePlans.last) const SizedBox(height: 10),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _openPlan(BuildContext context, ReadingPlan plan) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (context) {
        return ReadingPlanDetailSheet(
          plan: plan,
          onOpenReference: (reference) {
            Navigator.of(context).pop();
            onOpenReference(reference);
          },
        );
      },
    );
  }
}

SliverToBoxAdapter _hiddenReadingPlanSliver() {
  return const SliverToBoxAdapter(child: SizedBox.shrink());
}

SliverToBoxAdapter _readingPlanCard(BuildContext context, Widget child) {
  return SliverToBoxAdapter(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      child: Card(
        color: Theme.of(context).colorScheme.tintedCardColor,
        child: Padding(padding: const EdgeInsets.all(16), child: child),
      ),
    ),
  );
}

class _ReadingPlanError extends StatelessWidget {
  const _ReadingPlanError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return _ReadingPlanEmpty(
      title: l10n.readingPlanLoadErrorTitle,
      body: l10n.readingPlanLoadErrorBody,
      action: AppButton(
        label: l10n.retryAction,
        icon: Icons.refresh,
        onPressed: onRetry,
      ),
    );
  }
}

class _ReadingPlanEmpty extends StatelessWidget {
  const _ReadingPlanEmpty({
    required this.title,
    required this.body,
    this.action,
  });

  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          body,
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
        if (action != null) ...[const SizedBox(height: 12), action!],
      ],
    );
  }
}
