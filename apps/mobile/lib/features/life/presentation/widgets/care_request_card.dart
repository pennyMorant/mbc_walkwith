import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/care_request.dart';

class CareRequestCard extends StatelessWidget {
  const CareRequestCard({super.key, required this.request});

  final CareRequest request;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.volunteer_activism_outlined,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    request.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              request.body,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(label: _statusLabel(l10n, request.status)),
                AppChip(label: _privacyLabel(l10n, request.privacyLevel)),
                if (request.assigneeName.isNotEmpty)
                  AppChip(label: request.assigneeName),
                if (request.nextFollowUpAt != null)
                  AppChip(label: _followUpLabel(context, request)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

String _statusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'submitted' => l10n.careStatusSubmitted,
    'assigned' => l10n.careStatusAssigned,
    'in_progress' => l10n.careStatusInProgress,
    'resolved' => l10n.careStatusResolved,
    'archived' => l10n.careStatusArchived,
    _ => l10n.commonStatusUnknownLabel,
  };
}

String _privacyLabel(AppLocalizations l10n, String privacyLevel) {
  return switch (privacyLevel) {
    'pastoral_only' => l10n.carePrivacyPastoralOnly,
    'assigned_team' => l10n.carePrivacyAssignedTeam,
    'admin_restricted' => l10n.carePrivacyAdminRestricted,
    _ => l10n.commonPrivacyUnknownLabel,
  };
}

String _followUpLabel(BuildContext context, CareRequest request) {
  final value = request.nextFollowUpAt;
  if (value == null) {
    return '';
  }
  final local = MaterialLocalizations.of(context);
  return AppLocalizations.of(
    context,
  )!.careNextFollowUp(local.formatMediumDate(value));
}
