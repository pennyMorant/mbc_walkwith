import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';

class ShellNavigationBar extends StatelessWidget {
  const ShellNavigationBar({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return NavigationBar(
      selectedIndex: navigationShell.currentIndex,
      onDestinationSelected: (index) {
        if (index != navigationShell.currentIndex) {
          unawaited(HapticFeedback.selectionClick());
        }
        navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        );
      },
      destinations: [
        NavigationDestination(
          icon: const Icon(Icons.menu_book_outlined),
          selectedIcon: const Icon(Icons.menu_book),
          label: l10n.tabStudy,
        ),
        NavigationDestination(
          icon: const Icon(Icons.graphic_eq_outlined),
          selectedIcon: const Icon(Icons.graphic_eq),
          label: l10n.tabSermons,
        ),
        NavigationDestination(
          icon: const Icon(Icons.volunteer_activism_outlined),
          selectedIcon: const Icon(Icons.volunteer_activism),
          label: l10n.tabLife,
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          selectedIcon: const Icon(Icons.person),
          label: l10n.tabMine,
        ),
      ],
    );
  }
}
