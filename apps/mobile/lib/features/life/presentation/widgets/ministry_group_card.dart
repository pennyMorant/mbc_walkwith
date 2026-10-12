import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/ministry_group.dart';

class MinistryGroupCard extends StatelessWidget {
  const MinistryGroupCard({
    super.key,
    required this.group,
    required this.isSubmitting,
    required this.onApply,
    this.onWithdraw,
    this.onOpen,
    this.descriptionMaxLines = 2,
  });

  final MinistryGroup group;
  final bool isSubmitting;
  final VoidCallback? onApply;
  final VoidCallback? onWithdraw;
  final VoidCallback? onOpen;
  final int? descriptionMaxLines;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final status = _statusLabel(l10n, group);
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.groups_outlined, color: colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          group.name,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        if (group.description.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              group.description,
                              maxLines: descriptionMaxLines,
                              overflow: descriptionMaxLines == null
                                  ? TextOverflow.visible
                                  : TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  AppChip(
                    icon: Icons.schedule_outlined,
                    label: group.meetingTime.isEmpty
                        ? l10n.lifePostScheduleTbd
                        : group.meetingTime,
                  ),
                  if (group.location.isNotEmpty)
                    AppChip(icon: Icons.place_outlined, label: group.location),
                  if (group.leaderName.isNotEmpty)
                    AppChip(
                      icon: Icons.supervisor_account_outlined,
                      label: group.leaderName,
                    ),
                  AppChip(
                    icon: Icons.people_outline,
                    label: group.capacity == null
                        ? l10n.groupMemberCount(group.memberCount)
                        : l10n.groupMemberCapacity(
                            group.memberCount,
                            group.capacity!,
                          ),
                  ),
                  if (status != null)
                    AppChip(
                      icon: Icons.verified_outlined,
                      label: status,
                      selected: true,
                    ),
                ],
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: _action(group),
                icon: isSubmitting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        group.hasSubmittedApplication
                            ? Icons.cancel_outlined
                            : Icons.person_add_alt_1_outlined,
                      ),
                label: Text(_actionLabel(l10n, group)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  VoidCallback? _action(MinistryGroup group) {
    if (isSubmitting || group.isMember) {
      return null;
    }
    if (group.hasSubmittedApplication) {
      return onWithdraw;
    }
    return group.canApply ? onApply : null;
  }
}

String _actionLabel(AppLocalizations l10n, MinistryGroup group) {
  if (group.isMember) {
    return l10n.groupAlreadyMember;
  }
  if (group.hasSubmittedApplication) {
    return l10n.groupWithdrawAction;
  }
  if (group.isFull) {
    return l10n.groupCapacityFull;
  }
  return l10n.groupApplyAction;
}

String? _statusLabel(AppLocalizations l10n, MinistryGroup group) {
  if (group.isMember) {
    return l10n.groupAlreadyMember;
  }
  if (group.hasSubmittedApplication) {
    return l10n.groupApplicationSubmitted;
  }
  return null;
}
