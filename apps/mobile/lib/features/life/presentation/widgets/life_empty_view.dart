import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class LifeEmptyView extends StatelessWidget {
  const LifeEmptyView({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          l10n.lifeEmptyTitle,
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
    );
  }
}
