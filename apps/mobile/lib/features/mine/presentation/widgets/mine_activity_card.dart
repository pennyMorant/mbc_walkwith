import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../l10n/app_localizations.dart';

class MineActivityCard extends StatelessWidget {
  const MineActivityCard({
    super.key,
    required this.unreadNotificationCount,
    required this.showRegistrations,
  });

  final int unreadNotificationCount;
  final bool showRegistrations;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Column(
        children: [
          ListTile(
            leading: Badge(
              isLabelVisible: unreadNotificationCount > 0,
              label: Text('$unreadNotificationCount'),
              child: const Icon(Icons.notifications_outlined),
            ),
            title: Text(l10n.notificationInboxTitle),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.pushNamed(AppRouteNames.notifications),
          ),
          if (showRegistrations) ...[
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.event_available_outlined),
              title: Text(l10n.myEventRegistrationsTitle),
              trailing: const Icon(Icons.chevron_right),
              onTap: () =>
                  context.pushNamed(AppRouteNames.myEventRegistrations),
            ),
          ],
        ],
      ),
    );
  }
}
