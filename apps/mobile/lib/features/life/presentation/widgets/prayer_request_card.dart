import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/prayer_request.dart';

class PrayerRequestCard extends StatelessWidget {
  const PrayerRequestCard({
    super.key,
    required this.request,
    required this.isMine,
  });

  final PrayerRequest request;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final statusLabel = _statusLabel(l10n, request.status);
    final visibilityLabel = _visibilityLabel(l10n, request.visibility);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.favorite_outline, color: colorScheme.primary),
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
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(label: visibilityLabel),
                if (isMine) AppChip(label: statusLabel),
                if (isMine) AppChip(label: l10n.prayerMineLabel),
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
    'pending' || 'submitted' || 'under_review' => l10n.prayerStatusPending,
    'approved' => l10n.prayerStatusApproved,
    'hidden' => l10n.prayerStatusHidden,
    'archived' => l10n.prayerStatusArchived,
    _ => l10n.commonStatusUnknownLabel,
  };
}

String _visibilityLabel(AppLocalizations l10n, String visibility) {
  return switch (visibility) {
    'private' => l10n.prayerVisibilityPrivate,
    'public' => l10n.prayerVisibilityPublic,
    'members' => l10n.prayerVisibilityMembers,
    'group' => l10n.prayerVisibilityGroup,
    _ => l10n.commonVisibilityUnknownLabel,
  };
}
