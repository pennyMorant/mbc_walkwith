import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_unread_count_badge.dart';

class NotificationInboxHeader extends StatelessWidget {
  const NotificationInboxHeader({
    super.key,
    required this.unreadCount,
    required this.isSyncing,
    required this.hasItems,
    required this.onRefresh,
    required this.onMarkAllRead,
    required this.onClear,
  });

  final int unreadCount;
  final bool isSyncing;
  final bool hasItems;
  final VoidCallback onRefresh;
  final VoidCallback onMarkAllRead;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textScale = MediaQuery.textScalerOf(context).scale(1);

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 4, 4),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final useStackedLayout =
              constraints.maxWidth < 320 || textScale > 1.15;
          final title = _InboxTitle(unreadCount: unreadCount);
          final actions = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                tooltip: l10n.notificationRefreshAction,
                onPressed: isSyncing ? null : onRefresh,
                icon: isSyncing
                    ? const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.refresh),
              ),
              IconButton(
                tooltip: l10n.notificationMarkAllReadAction,
                onPressed: !hasItems || isSyncing ? null : onMarkAllRead,
                icon: const Icon(Icons.done_all),
              ),
              IconButton(
                tooltip: l10n.notificationClearAction,
                onPressed: !hasItems || isSyncing ? null : onClear,
                icon: const Icon(Icons.delete_outline),
              ),
            ],
          );

          if (useStackedLayout) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                title,
                const SizedBox(height: 2),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: actions,
                ),
              ],
            );
          }

          return Row(
            children: [
              Expanded(child: title),
              actions,
            ],
          );
        },
      ),
    );
  }
}

class _InboxTitle extends StatelessWidget {
  const _InboxTitle({required this.unreadCount});

  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Row(
      children: [
        Expanded(
          child: Text(
            l10n.notificationInboxTitle,
            style: Theme.of(context).textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        if (unreadCount > 0) ...[
          const SizedBox(width: 8),
          AppUnreadCountBadge(
            count: unreadCount,
            semanticLabel: l10n.unreadCountSemanticLabel(
              l10n.notificationInboxTitle,
              unreadCount,
            ),
            child: const Icon(Icons.notifications_outlined),
          ),
        ],
      ],
    );
  }
}
