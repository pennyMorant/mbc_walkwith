import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_error_state.dart';

class ReaderLoadError extends StatelessWidget {
  const ReaderLoadError({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return AppErrorState(
      title: l10n.readerLoadErrorTitle,
      body: l10n.readerLoadErrorBody,
      retryLabel: l10n.retryAction,
      icon: Icons.menu_book_outlined,
      onRetry: onRetry,
    );
  }
}
