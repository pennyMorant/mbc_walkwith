import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../data/discipleship_repository.dart';
import '../../domain/discipleship_assignment.dart';

class MineDiscipleshipCard extends ConsumerWidget {
  const MineDiscipleshipCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final assignmentsAsync = ref.watch(myDiscipleshipAssignmentsProvider);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: assignmentsAsync.when(
          loading: () => const SizedBox(
            height: 84,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, stackTrace) => _CardBody(
            title: l10n.mineDiscipleshipTitle,
            body: l10n.mineDiscipleshipLoadError,
            action: AppButton(
              label: l10n.retryAction,
              icon: Icons.refresh,
              onPressed: () {
                ref.invalidate(myDiscipleshipAssignmentsProvider);
              },
            ),
          ),
          data: (assignments) {
            final visibleAssignments = assignments
                .where((item) => item.status != 'cancelled')
                .take(3)
                .toList(growable: false);
            if (visibleAssignments.isEmpty) {
              return _CardBody(
                title: l10n.mineDiscipleshipTitle,
                body: l10n.mineDiscipleshipEmpty,
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.mineDiscipleshipTitle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.mineDiscipleshipBody,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 14),
                for (final assignment in visibleAssignments) ...[
                  _AssignmentTile(assignment: assignment),
                  if (assignment != visibleAssignments.last)
                    const SizedBox(height: 10),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AssignmentTile extends StatelessWidget {
  const _AssignmentTile({required this.assignment});

  final DiscipleshipAssignment assignment;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final totalCount = assignment.taskTotalCount;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.mineDiscipleshipTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                AppChip(
                  icon: Icons.route_outlined,
                  label: _statusLabel(l10n, assignment.status),
                  selected: assignment.status == 'completed',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(
                  icon: Icons.done_all_outlined,
                  label: l10n.mineDiscipleshipProgressChip(
                    assignment.completedTaskCount,
                    totalCount,
                  ),
                ),
                if (assignment.assigneeName.trim().isNotEmpty)
                  AppChip(
                    icon: Icons.support_agent_outlined,
                    label: assignment.assigneeName,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CardBody extends StatelessWidget {
  const _CardBody({required this.title, required this.body, this.action});

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
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          body,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
        if (action != null) ...[const SizedBox(height: 14), action!],
      ],
    );
  }
}

String _statusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'not_started' => l10n.discipleshipStatusNotStarted,
    'in_progress' => l10n.discipleshipStatusInProgress,
    'blocked' => l10n.discipleshipStatusBlocked,
    'completed' => l10n.discipleshipStatusCompleted,
    'paused' => l10n.discipleshipStatusPaused,
    'cancelled' => l10n.discipleshipStatusCancelled,
    _ => l10n.commonStatusUnknownLabel,
  };
}
