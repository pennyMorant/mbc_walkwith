import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import 'life_unread_count_badge.dart';

enum LifeDashboardTab {
  week,
  events,
  groups,
  courses,
  serving,
  prayer;

  String label(AppLocalizations l10n) {
    return switch (this) {
      LifeDashboardTab.week => l10n.lifeTabWeek,
      LifeDashboardTab.events => l10n.lifeTabEvents,
      LifeDashboardTab.groups => l10n.lifeTabGroups,
      LifeDashboardTab.courses => l10n.lifeTabCourses,
      LifeDashboardTab.serving => l10n.lifeTabServing,
      LifeDashboardTab.prayer => l10n.lifeTabPrayer,
    };
  }
}

class LifeDashboardTabBarHeader extends SliverPersistentHeaderDelegate {
  LifeDashboardTabBarHeader({required this.tabBar});

  final TabBar tabBar;

  @override
  double get minExtent => tabBar.preferredSize.height + 16;

  @override
  double get maxExtent => tabBar.preferredSize.height + 16;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        boxShadow: overlapsContent
            ? [
                BoxShadow(
                  color: colorScheme.shadow.withValues(alpha: 0.08),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 10),
        child: tabBar,
      ),
    );
  }

  @override
  bool shouldRebuild(LifeDashboardTabBarHeader oldDelegate) {
    return oldDelegate.tabBar != tabBar;
  }
}

class LifeDashboardTabLabel extends StatelessWidget {
  const LifeDashboardTabLabel({
    super.key,
    required this.label,
    required this.unreadCount,
  });

  final String label;
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final hasUnread = unreadCount > 0;
    return Semantics(
      label: hasUnread
          ? l10n.unreadCountSemanticLabel(label, unreadCount)
          : label,
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label),
            if (hasUnread) ...[
              const SizedBox(width: 6),
              LifeUnreadCountBadge(unreadCount: unreadCount),
            ],
          ],
        ),
      ),
    );
  }
}
