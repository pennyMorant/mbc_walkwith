import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/serving_assignment.dart';
import '../serving_presenters.dart';

class ServingAssignmentCard extends StatelessWidget {
  const ServingAssignmentCard({
    super.key,
    required this.assignment,
    required this.isSubmitting,
    required this.onConfirm,
    required this.onLeave,
    this.onOpen,
  });

  final ServingAssignment assignment;
  final bool isSubmitting;
  final VoidCallback onConfirm;
  final VoidCallback onLeave;
  final VoidCallback? onOpen;

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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      assignment.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  AppChip(
                    label: servingAssignmentStatusLabel(
                      l10n,
                      assignment.status,
                    ),
                    selected: true,
                  ),
                  if (onOpen != null) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right),
                  ],
                ],
              ),
              const SizedBox(height: 8),
              Text('${assignment.teamName} · ${assignment.roleName}'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  _Meta(icon: Icons.schedule, label: _timeLabel(context)),
                  _Meta(icon: Icons.place_outlined, label: assignment.location),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                alignment: WrapAlignment.end,
                spacing: 8,
                runSpacing: 8,
                children: [
                  TextButton(
                    onPressed: assignment.canRequestLeave && !isSubmitting
                        ? onLeave
                        : null,
                    child: Text(l10n.servingLeaveAction),
                  ),
                  FilledButton.icon(
                    onPressed: assignment.canConfirm && !isSubmitting
                        ? onConfirm
                        : null,
                    icon: isSubmitting
                        ? const SizedBox.square(
                            dimension: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.check_circle_outline),
                    label: Text(l10n.servingConfirmAction),
                  ),
                ],
              ),
            ],
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
