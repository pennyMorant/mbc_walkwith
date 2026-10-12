import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../study/data/reading_plan_repository.dart';
import '../../../study/domain/reading_plan.dart';

class MineReadingPlanCard extends ConsumerWidget {
  const MineReadingPlanCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final assignmentsAsync = ref.watch(myReadingPlanAssignmentsProvider);

    return assignmentsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (error, stackTrace) => _readingPlanCard(
        _CardBody(
          title: l10n.mineReadingPlansTitle,
          body: l10n.readingPlanLoadErrorBody,
          action: AppButton(
            label: l10n.retryAction,
            icon: Icons.refresh,
            onPressed: () => ref.invalidate(myReadingPlanAssignmentsProvider),
          ),
        ),
      ),
      data: (assignments) {
        final visibleAssignments = assignments.take(2).toList();
        if (visibleAssignments.isEmpty) {
          return _readingPlanCard(
            _CardBody(
              title: l10n.mineReadingPlansTitle,
              body: l10n.mineReadingPlansEmpty,
              action: AppButton(
                label: l10n.mineReadingPlansOpenStudyAction,
                icon: Icons.menu_book_outlined,
                onPressed: () => context.goNamed(AppRouteNames.study),
              ),
            ),
          );
        }

        return _readingPlanCard(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.mineReadingPlansTitle,
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.mineReadingPlansBody,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 14),
              for (final assignment in visibleAssignments) ...[
                _AssignmentRow(assignment: assignment),
                if (assignment != visibleAssignments.last)
                  const SizedBox(height: 10),
              ],
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: AppButton(
                  label: l10n.readingPlanViewAllAction,
                  icon: Icons.arrow_forward_rounded,
                  onPressed: () =>
                      context.pushNamed(AppRouteNames.myReadingPlans),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

Widget _readingPlanCard(Widget child) {
  return Padding(
    padding: const EdgeInsets.only(top: 12),
    child: Card(
      child: Padding(padding: const EdgeInsets.all(18), child: child),
    ),
  );
}

class _AssignmentRow extends StatelessWidget {
  const _AssignmentRow({required this.assignment});

  final ReadingPlanAssignment assignment;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Text(
                assignment.planTitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(width: 10),
            AppChip(
              icon: Icons.done_all_outlined,
              label: l10n.mineReadingPlanProgressChip(
                assignment.completedCount,
              ),
              selected: assignment.status == 'completed',
            ),
          ],
        ),
      ),
    );
  }
}

class _CardBody extends StatelessWidget {
  const _CardBody({
    required this.title,
    required this.body,
    required this.action,
  });

  final String title;
  final String body;
  final Widget action;

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
        const SizedBox(height: 14),
        action,
      ],
    );
  }
}
