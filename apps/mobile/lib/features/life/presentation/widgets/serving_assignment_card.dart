import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/serving_assignment.dart';
import '../serving_presenters.dart';

enum ServingAssignmentCardPendingAction { confirm, requestLeave, external }

class ServingAssignmentCard extends StatelessWidget {
  const ServingAssignmentCard({
    super.key,
    required this.assignment,
    required this.onConfirm,
    required this.onLeave,
    this.onOpen,
    this.pendingAction,
  });

  final ServingAssignment assignment;
  final VoidCallback onConfirm;
  final VoidCallback onLeave;
  final VoidCallback? onOpen;
  final ServingAssignmentCardPendingAction? pendingAction;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final textScale = MediaQuery.textScalerOf(context).scale(1);
              final stackHeader =
                  constraints.maxWidth < 300 || textScale > 1.15;
              final title = Text(
                assignment.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              );
              final status = AppChip(
                label: servingAssignmentStatusLabel(l10n, assignment.status),
                selected: true,
              );
              final openIndicator = onOpen == null
                  ? null
                  : const Icon(Icons.chevron_right);
              final isSubmitting = pendingAction != null;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (stackHeader) ...[
                    title,
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Flexible(child: status),
                        if (openIndicator != null) ...[
                          const SizedBox(width: 4),
                          openIndicator,
                        ],
                      ],
                    ),
                  ] else
                    Row(
                      children: [
                        Expanded(child: title),
                        const SizedBox(width: 10),
                        status,
                        if (openIndicator != null) ...[
                          const SizedBox(width: 4),
                          openIndicator,
                        ],
                      ],
                    ),
                  const SizedBox(height: 8),
                  Text(
                    '${assignment.teamName} · ${assignment.roleName}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      _Meta(icon: Icons.schedule, label: _timeLabel(context)),
                      _Meta(
                        icon: Icons.place_outlined,
                        label: assignment.location,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    alignment: WrapAlignment.end,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      AppButton(
                        label: l10n.servingLeaveAction,
                        onPressed: assignment.canRequestLeave && !isSubmitting
                            ? onLeave
                            : null,
                        variant: AppButtonVariant.text,
                        loading:
                            pendingAction ==
                            ServingAssignmentCardPendingAction.requestLeave,
                      ),
                      AppButton(
                        label: l10n.servingConfirmAction,
                        icon: Icons.check_circle_outline,
                        onPressed: assignment.canConfirm && !isSubmitting
                            ? onConfirm
                            : null,
                        variant: AppButtonVariant.filled,
                        loading:
                            pendingAction ==
                            ServingAssignmentCardPendingAction.confirm,
                      ),
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

  String _timeLabel(BuildContext context) {
    final local = MaterialLocalizations.of(context);
    final startsAt = assignment.startsAt.toLocal();
    final date = local.formatMediumDate(startsAt);
    final time = local.formatTimeOfDay(TimeOfDay.fromDateTime(startsAt));
    return '$date · $time';
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    if (label.isEmpty) {
      return const SizedBox.shrink();
    }
    return AppChip(icon: icon, label: label);
  }
}
