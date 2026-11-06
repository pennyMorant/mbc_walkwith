import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_error_state.dart';

class SermonErrorView extends StatelessWidget {
  const SermonErrorView({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return AppErrorState(
      title: l10n.sermonLoadErrorTitle,
      body: l10n.sermonLoadErrorBody,
      retryLabel: l10n.retryAction,
      onRetry: onRetry,
    );
  }
}
