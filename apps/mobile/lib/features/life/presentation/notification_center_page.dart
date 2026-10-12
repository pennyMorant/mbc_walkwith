import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../data/push_notification_inbox_repository.dart';
import 'notification_inbox_provider.dart';
import 'push_notifications_controller.dart';

class NotificationCenterPage extends ConsumerWidget {
  const NotificationCenterPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final inboxState = ref.watch(notificationInboxProvider);
    final inboxItems = inboxState.items;
    final inboxNotifier = ref.read(notificationInboxProvider.notifier);
    final unreadCount = inboxState.unreadCount;
    final pushState = ref.watch(pushNotificationsControllerProvider);
    final pushController = ref.read(
      pushNotificationsControllerProvider.notifier,
    );
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.notificationsPageTitle),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(6, 10, 6, 6),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 4, 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            l10n.notificationInboxTitle,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                        if (unreadCount > 0)
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: Semantics(
                              label: l10n.unreadCountSemanticLabel(
                                l10n.notificationInboxTitle,
                                unreadCount,
                              ),
                              child: ExcludeSemantics(
                                child: Badge(
                                  label: Text('$unreadCount'),
                                  child: const Icon(
                                    Icons.notifications_outlined,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        IconButton(
                          tooltip: l10n.notificationRefreshAction,
                          onPressed: inboxState.isSyncing
                              ? null
                              : () => unawaited(inboxNotifier.refresh()),
                          icon: inboxState.isSyncing
                              ? const SizedBox.square(
                                  dimension: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.refresh),
                        ),
                        IconButton(
                          tooltip: l10n.notificationMarkAllReadAction,
                          onPressed: inboxItems.isEmpty || inboxState.isSyncing
                              ? null
                              : () => unawaited(inboxNotifier.markAllRead()),
                          icon: const Icon(Icons.done_all),
                        ),
                        IconButton(
                          tooltip: l10n.notificationClearAction,
                          onPressed: inboxItems.isEmpty || inboxState.isSyncing
                              ? null
                              : () => unawaited(inboxNotifier.clear()),
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ],
                    ),
                  ),
                  if (inboxState.lastError case final error?)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 2, 12, 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 20,
                            color: colorScheme.error,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              error,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: colorScheme.error),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (inboxItems.isEmpty)
                    ListTile(
                      leading: const CircleAvatar(
                        child: Icon(Icons.notifications_none),
                      ),
                      title: Text(l10n.notificationInboxEmptyTitle),
                      subtitle: Text(l10n.notificationInboxEmptyBody),
                    )
                  else
                    ...inboxItems.map(
                      (item) => _NotificationInboxTile(
                        item: item,
                        receivedAtLabel: _formatNotificationTime(
                          context,
                          item.receivedAt,
                        ),
                        onTap: inboxState.isSyncing
                            ? null
                            : () async {
                                await inboxNotifier.markRead(item.id);
                                final route = item.route;
                                if (route != null &&
                                    route.isNotEmpty &&
                                    context.mounted) {
                                  context.push(route);
                                }
                              },
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.notificationPermissionTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    pushState.supported
                        ? pushState.permissionGranted
                              ? l10n.notificationPermissionEnabledBody
                              : l10n.notificationPermissionDisabledBody
                        : l10n.notificationDeviceUnavailableBody,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (pushState.supported) ...[
                    const SizedBox(height: 14),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(
                        Icons.notifications_active_outlined,
                      ),
                      title: Text(l10n.notificationPermissionTitle),
                      value: pushState.permissionGranted,
                      onChanged: pushState.isLoading
                          ? null
                          : (_) {
                              if (pushState.permissionGranted) {
                                unawaited(
                                  pushController
                                      .openSystemNotificationSettingsAndRefresh(),
                                );
                              } else {
                                unawaited(
                                  pushController.requestPermissionAndSync(),
                                );
                              }
                            },
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationInboxTile extends StatelessWidget {
  const _NotificationInboxTile({
    required this.item,
    required this.receivedAtLabel,
    required this.onTap,
  });

  final PushNotificationInboxItem item;
  final String receivedAtLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: item.isRead
            ? colorScheme.surfaceContainerHighest
            : colorScheme.primaryContainer,
        foregroundColor: item.isRead
            ? colorScheme.onSurfaceVariant
            : colorScheme.onPrimaryContainer,
        child: Icon(_iconForNotificationType(item.type)),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              item.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: item.isRead ? FontWeight.w600 : FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            receivedAtLabel,
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      subtitle: Text(item.body, maxLines: 2, overflow: TextOverflow.ellipsis),
      trailing: item.route == null
          ? null
          : Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
      onTap: onTap,
    );
  }
}

IconData _iconForNotificationType(String type) {
  return switch (type) {
    'weekly_bulletin_published' => Icons.article_outlined,
    'life_post_published' => Icons.event_note_outlined,
    'prayer_update_published' => Icons.favorite_outline,
    'sermon_published' => Icons.menu_book_outlined,
    _ => Icons.notifications_outlined,
  };
}

String _formatNotificationTime(BuildContext context, DateTime receivedAt) {
  final local = receivedAt.toLocal();
  final now = DateTime.now();
  final timeLabel = TimeOfDay.fromDateTime(local).format(context);
  if (local.year == now.year &&
      local.month == now.month &&
      local.day == now.day) {
    return timeLabel;
  }
  return '${local.month}/${local.day} $timeLabel';
}
