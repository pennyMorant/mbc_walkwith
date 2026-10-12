import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'widgets/shell_navigation_bar.dart';

class ShellPage extends StatelessWidget {
  const ShellPage({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: ShellNavigationBar(navigationShell: navigationShell),
    );
  }
}
